import { startViewHandler } from "./infrastructure";
import { servers } from "./servers";
import { allViews } from "./app/views";
import { domainKactors } from "./app/domain";

const storeShards = process.env.STORE_SHARDS ? process.env.STORE_SHARDS.split(",") : servers.storeShards;
const kafkaBrokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(",") : servers.kafkaBrokers;

startViewHandler(kafkaBrokers, storeShards, allViews, domainKactors)