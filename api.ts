import { startServer } from "./app/api";
import { domainKactors } from "./app/domain";
import { createKActorBus, createQueryStore } from "./infrastructure";
import { servers } from "./servers";

const queryStore = createQueryStore(servers.storeShards);
const kActorBus = createKActorBus(servers.kafkaBrokers, domainKactors);
console.log("Starting API server on port", parseInt(servers.api.split(":")[2]));
startServer(queryStore, kActorBus, parseInt(servers.api.split(":")[2]) );