import { domainKactors } from "./app/domain";
import { startKActorSystem } from "./infrastructure";
import { servers } from "./servers";

startKActorSystem(servers.kafkaBrokers, domainKactors)