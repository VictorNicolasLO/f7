import {
    createKState,
createInMemoryStore
} from 'k-state'
import {
    Kafka
} from 'kafkajs'

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'],
    logLevel: 2,
})

const store = createInMemoryStore()
const kState = createKState(store, kafka)

const admin = kafka.admin()
await admin.connect()
await admin.createTopics({
    topics: [{
        topic: 'ustest',
        numPartitions: 10,
        replicationFactor: 1
    }]
})
await admin.disconnect()

kState.fromTopic('ustest').reduce((message, key, state)=>{
    console.log(state)
    const name = message.name

    return {
        state: {
            name
        },
        reactions: []
    }
})