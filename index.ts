import {
    Kafka
} from 'kafkajs';
import { servers } from './servers';
const kafka = new Kafka({
    clientId: 'kactor-bus',
    brokers: servers.kafkaBrokers,
});
const admin = kafka.admin();
await admin.connect();
await admin.deleteTopics({
    topics: ['kactors-snapshots', 'kactors'],
})

// TODO: Hop validation based on correlationId to prevent recursion
// TODO: OverrideStore to save not transactional data
// TODO: Add back supression for slow actors -> use store to fetch the data
// TODO: Add ttl and queue duration persistence