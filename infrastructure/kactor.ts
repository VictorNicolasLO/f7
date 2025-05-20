import {
    createInMemoryStore,
    createKState
} from 'k-state'
import { Kafka } from 'kafkajs'
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

function getClassMethods(cls: any): string[] {
    return Object.getOwnPropertyNames(cls.prototype)
        .filter(name => typeof cls.prototype[name] === 'function' && name !== 'constructor');
}

type ClassMethodMap = { arr: string[], methods: Record<string, number> }
const getClassMethodMap = (clz: new () => KActor): ClassMethodMap => {
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
    args: any[]
}


export const startKActorSystem = async (kafkaBrokers: string[], kActors: (new () => KActor)[]) => {

    const classesMap = kActors.reduce((acc, clz, index) => {
        acc[clz.name] = { index, methodsMap: getClassMethodMap(clz) }
        return acc
    }, {} as Record<string, { index: number, methodsMap: ClassMethodMap }>)


    const kafka = new Kafka({
        clientId: 'kactor',
        brokers: kafkaBrokers
    })
    const admin = kafka.admin()
    await admin.connect()
    await admin.createTopics({
        topics: [{
            topic: 'kactors',
            numPartitions: 10,
            replicationFactor: 1,
            configEntries: [
                {
                    name: 'retention.ms',
                    // 1 days
                    value: '86400000'
                }
            ]
        }]
    })
    await admin.disconnect()
    const store = createInMemoryStore()
    const kstate = createKState(store, kafka)

    kstate.fromTopic<{actorState: any, classIndex: number }>('kactors').reduce((message: KActorMessage, key, state) => {
        const reactions: { message: KActorMessage, topic:string, key:string }[] = []
        const classIndex = message.classIndex
        const methodIndex = message.methodIndex
        const methodName = classesMap[message.classIndex].methodsMap.arr[methodIndex]
        const actorState = state ? state.actorState : null
        kActors[classIndex].prototype[methodName].apply({
            state: {}, 
            ref: (clz: new () => any, key: string) => {
                new Proxy({}, {
                    get(target, prop, receiver) {
                        if (prop !== 'equals' && prop !== 'classType' && prop !== 'classType') {
                            return (...args: any) => {
                                reactions.push({
                                    topic: 'kactors',
                                    key: key,
                                    message: {
                                        classIndex: classesMap[clz.name].index,
                                        methodIndex: classesMap[clz.name].methodsMap.methods[prop as string],
                                        args: args
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
        }, message.args)

        return {
            reactions,
            state : {
                actorState,
                classIndex
            }
        }
    })

} 

export const createKActorBus = (kafkaBrokers: string[], kActors: (new () => KActor)[]): KActorBus => {
    const classesMap = kActors.reduce((acc, clz, index) => {
        acc[clz.name] = { index, methodsMap: getClassMethodMap(clz) }
        return acc
    }, {} as Record<string, { index: number, methodsMap: ClassMethodMap }>)
    
    const kafka = new Kafka({
        clientId: 'kactor',
        brokers: kafkaBrokers
    })
    const producer = kafka.producer()
    return {
        send: async (cb: (ref: <T>(clz: new () => T, key: string) => Ref<T>) => any) => {
            const reactions: {key:string, value:string}[] = []
            const ref = <T>(clz: new () => T, key: string) => {
                return new Proxy({}, {
                    get(target, prop, receiver) {
                        if (prop !== 'equals' && prop !== 'classType' && prop !== 'classType') {
                            return (...args: any) => {
                                reactions.push({
                                    key: key,
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
            await producer.send({
                topic: 'kactors',
                messages: reactions
            })
        }
    } as KActorBus
}