import { startServer } from "./app/api";
import { domainKactors } from "./app/domain";
import { createKActorBus, createQueryStore } from "./infrastructure";
import { servers } from "./servers";

const queryStore = createQueryStore(servers.storeShards);
const kActorBus = await createKActorBus(servers.kafkaBrokers, domainKactors);
startServer(queryStore, kActorBus, parseInt(servers.api.split(":")[2]) );