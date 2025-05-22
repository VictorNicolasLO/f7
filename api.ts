
import { startHttp2ApiServer } from "./app/api/index.http2";
import { domainKactors } from "./app/domain";
import { createKActorBus } from "./infrastructure/kactor-bus";
import { servers } from "./servers";
import { createQueryStore } from "./infrastructure";


const queryStore = createQueryStore(servers.storeShards);
const kActorBus = await createKActorBus(servers.kafkaBrokers, domainKactors);
const PORT = parseInt(process.env.PORT || servers.api.split(":")[2]);
startHttp2ApiServer(queryStore, kActorBus,  PORT);