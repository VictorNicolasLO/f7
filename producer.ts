import {
    Kafka,

} from 'kafkajs';

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
})

const producer = kafka.producer()

await producer.connect()

await producer.send({
    topic: 'ustest',
    messages: [
        {
            key: 'key1',
            value: JSON.stringify({
                name: 'test2'
            })
        }
    ]
})

await producer.disconnect()