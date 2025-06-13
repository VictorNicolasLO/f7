
import { startServer } from "./app/api/index";
import { domainKactors } from "./app/domain";
import { createKActorBus } from "./infrastructure/kactor-bus";
import { servers } from "./servers";
import { createQueryStore } from "./infrastructure";

const storeShards = process.env.STORE_SHARDS ? process.env.STORE_SHARDS.split(",") : servers.storeShards;
const kafkaBrokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(",") : servers.kafkaBrokers;
const port = parseInt(process.env.PORT || servers.api.split(":")[2]);

const queryStore = createQueryStore(storeShards);
const kActorBus = await createKActorBus(kafkaBrokers, domainKactors);
startServer(queryStore, kActorBus,  port);