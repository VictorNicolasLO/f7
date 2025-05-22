import { getClassMethodMap, KActor, type ClassMethodMap, type KActorBus, type Ref } from "./kactor"
import { Kafka } from 'kafkajs'
import { createBatcher, createDeferredPromise } from './utils'

export const createKActorBus = async (kafkaBrokers: string[], kActors: (new () => KActor)[]): Promise<KActorBus>  => {
    const classesMap = kActors.reduce((acc, clz, index) => {
        acc[clz.name] = { index, methodsMap: getClassMethodMap(clz) }
        return acc
    }, {} as Record<string, { index: number, methodsMap: ClassMethodMap }>)

    const kafka = new Kafka({
        clientId: 'kactor',
        brokers: kafkaBrokers
    })
  
    const producer = kafka.producer()

    
    await producer.connect()

    let messages:any = []
    let deferredPromise: any = undefined
    let ongoingDeferredPromise: any = undefined
    const startQueue = async () => {
                    ongoingDeferredPromise = deferredPromise
                    const messagesToSend = messages
                    
                    messages = []
                    deferredPromise = undefined
                    await producer.send({
                        topic: 'kactors',
                        messages: messagesToSend,
                        compression: 1,
                    })
                    console.log('sent messages', messagesToSend.length)
                    
                    ongoingDeferredPromise.resolve()
                    

                }

    return {
        send: async (cb: (ref: <T>(clz: new () => T, key: string) => Ref<T>) => any) => {
            if(ongoingDeferredPromise) {
                await ongoingDeferredPromise.promise
            }
            if (!deferredPromise) {

                deferredPromise = createDeferredPromise()
                setTimeout(startQueue, 10)
            }
            const ref = <T>(clz: new () => T, key: string) => {
                return new Proxy({}, {
                    get(target, prop, receiver) {
                        if (prop !== 'equals' && prop !== 'classType' && prop !== 'classType') {
                            return (...args: any) => {
                                messages.push({
                                    key: `${classesMap[clz.name].index}/${key}`,
                                    value: JSON.stringify({
                                        classIndex: classesMap[clz.name].index,
                                        methodIndex: classesMap[clz.name].methodsMap.methods[prop as string],
                                        args: args
                                    }) ,

                                })
                                return undefined;
                            };
                        } else {
                            return (target as any)[prop];
                        }

                    }
                }) as unknown as T
            }
            cb(ref)
            await deferredPromise.promise

        }
    } as KActorBus
}