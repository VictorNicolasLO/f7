import {
    createInMemoryStore,
    createKState
} from 'k-state'
import { Kafka } from 'kafkajs'
import { createLevelDBStore } from './persistence/level-db'
export type Ref<T> = Pick<T, Exclude<keyof T, "state" | "ref" | "key">>
export abstract class KActor {
    key!: string
    ref<T>(clz: new () => T, key: string): Ref<T> {
        return new clz()
    }
}

export type KActorBus = {
    send: (cb: (ref: <T>(clz: new () => T, key: string) => Ref<T>) => any) => Promise<void>

}

export function getClassMethods(cls: any): string[] {
    return Object.getOwnPropertyNames(cls.prototype)
        .filter(name => typeof cls.prototype[name] === 'function' && name !== 'constructor');
}

export type ClassMethodMap = { arr: string[], methods: Record<string, number> }
export const getClassMethodMap = (clz: new () => KActor): ClassMethodMap => {
    const classMethods = getClassMethods(clz)
    return {
        arr: classMethods,
        methods: classMethods.reduce((acc, method, index) => {
            acc[method] = index
            return acc
        }, {} as Record<string, number>)
    }
}

type KActorMessage = {
    classIndex: number,
    methodIndex: number,
    args: any[],
    correlationDate: number
}


export const startKActorSystem = async (kafkaBrokers: string[], kActors: (new () => KActor)[]) => {

    const classesMap = kActors.reduce((acc, clz, index) => {
        acc[clz.name] = { index, methodsMap: getClassMethodMap(clz) }
        return acc
    }, {} as Record<string, { index: number, methodsMap: ClassMethodMap }>)


    const kafka = new Kafka({
        clientId: 'kactor',
        brokers: kafkaBrokers,
        logLevel: 2
    })
    const admin = kafka.admin()
    await admin.connect()
    await admin.createTopics({
        topics: [{
            topic: 'kactors',
            numPartitions: 10,
            replicationFactor: 1, // 3,
            configEntries: [
                {
                    name: 'retention.ms',
                    // 1 days
                    value: '86400000'
                }
            ]
        }, 
        {
            topic: 'kactors-snapshots',
            numPartitions: 10,
            replicationFactor: 1,// 3,
            configEntries: [
                { name: 'cleanup.policy', value: 'compact' },
                { name: 'retention.ms', value: '604800000' }, // 7 days
                { name: 'retention.bytes', value: '-1' },
            ]
        }
    ]
    })
    await admin.disconnect()
    // const store = createLevelDBStore('./_storage-files/kactors')
    const store = createInMemoryStore()
    const kstate = createKState(store, kafka)

    kstate.fromTopic<{ actorState: any, classIndex: number, correlationDate: number }>('kactors').reduce((message: KActorMessage, key, state) => {
        const reactions: { message: KActorMessage, topic: string, key: string }[] = []
        const classIndex = message.classIndex
        const methodIndex = message.methodIndex
        const correlationDate = message.correlationDate
        const methodName = classesMap[kActors[classIndex].name].methodsMap.arr[methodIndex]
        const actorState = state ? state.actorState : null
        const actorKey = key.split('/')[1]
        const instance = {
            state: actorState,
            key: actorKey,
            ref: (clz: new () => any, key: string) => {
                return new Proxy({}, {
                    get(target, prop, receiver) {
                        if (prop !== 'equals' && prop !== 'classType' && prop !== 'classType') {
                            return (...args: any) => {
                                reactions.push({
                                    topic: 'kactors',
                                    key: `${classesMap[clz.name].index}/${key}`,
                                    message: {
                                        classIndex: classesMap[clz.name].index,
                                        methodIndex: classesMap[clz.name].methodsMap.methods[prop as string],
                                        args: args,
                                        correlationDate
                                    },

                                })
                                return undefined;
                            };
                        } else {
                            return (target as any)[prop];
                        }

                    }
                }) as unknown
            }
        }
        kActors[classIndex].prototype[methodName].apply(instance, message.args)

        return {
            reactions,
            state: {
                actorState: instance.state,
                classIndex,
                correlationDate
            }
        }
    })

}

