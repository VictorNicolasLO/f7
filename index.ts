import {
    Kafka
} from 'kafkajs';
const kafka = new Kafka({
    clientId: 'kactor-bus',
    brokers: ['localhost:9092'],
});
const admin = kafka.admin();
await admin.connect();
await admin.deleteTopics({
    topics: ['kactors-snapshots'],
})