import { Kafka } from 'kafkajs';
import { createHttp2Client } from './http2-client';
import type { KActor } from './kactor';
import { getPartition } from './utils';

export type QueryPrepResponse = {
    store: string,
    key: string,
    sortKey?: string,
    data: any,
}
type ViewRes = {
    clz: new () => any,
    viewExec: (key: string, state: any) => QueryPrepResponse | undefined,
}
export const view = <T extends { state: unknown }>(clz: new () => T, viewExec: (key: string, state: T['state']) => QueryPrepResponse | undefined) => {
    return {
        clz,
        viewExec,
    }
}



const SNAPTHOT_PARTITIONS = 10
export const startViewHandler = async (
    kafkaBrokers: string[],
    storeShards: string[],
    views: ViewRes[],
    kActors: (new () => KActor)[]
) => {
    const kafka = new Kafka({
        clientId: 'view-handler',
        brokers: kafkaBrokers,
    });

    const viewsByActor = kActors.map((clz) => views.filter((view) => view.clz === clz))

    const shardClients = await Promise.all(storeShards.map((shard) => createHttp2Client(shard)));



    const consumer = kafka.consumer({ groupId: 'view-handler', readUncommitted: false });


    const run = async () => {
        await consumer.connect();
        await consumer.subscribe({ topic: 'kactors-snapshots', fromBeginning: true });

        await consumer.run({
            eachBatchAutoResolve: true,
            autoCommit: true,
            eachBatch: async ({ batch }) => {
                console.log('batch', batch.messages.length)
                const messages = batch.messages;
                let maxCorrelationDate: number | undefined = undefined
                await Promise.all(messages.map(async ({ key, value }) => {
                    if (!key || !value) {
                        return
                    }
                    const keyStr = key.toString()
                    if (keyStr.startsWith('snapshot-offset')) {
                        return
                    }
                    const valueStr = value.toString()
                    const valueObj = JSON.parse(valueStr)
                    const classIndex = valueObj.payload.classIndex
                    const actorState = valueObj.payload.actorState
                    const correlationDate:number = valueObj.payload.correlationDate
                    maxCorrelationDate = maxCorrelationDate ? maxCorrelationDate > correlationDate ? maxCorrelationDate : correlationDate : correlationDate
                    const actorKey = keyStr.split('/')[1]
                    try {
                        
                        const mutationQueries = viewsByActor[classIndex]
                            .map(({ viewExec }) => viewExec(actorKey, actorState))
                            .filter((viewRes) => viewRes !== undefined)
                        await Promise.all(
                            mutationQueries
                                .map(async (mutationQuery) =>
                                    shardClients[getPartition(mutationQuery.key, storeShards.length)]
                                        .request('/store/mutate', mutationQuery)
                                ))
                    
                    } catch (e) {
                        console.error('Error in view handler', e)
                        throw e
                    }
                }))
                console.log('maxCorrelationDate', maxCorrelationDate)
                console.log('current date', new Date().toISOString())
                console.log('Max difference date from correlationDate in Seconds', (new Date().getTime() - new Date(maxCorrelationDate || '').getTime()) / 1000)

            },
        });
        const topicPartitions = new Array(SNAPTHOT_PARTITIONS)
            .fill(0)
            .map((_, index) => ({ topic: 'kactors-snapshots', partition: index, offset: '0' }));

        topicPartitions.forEach((partition) => {
            consumer.seek(partition);
        });
    };

    run().catch(console.error);
}