import { domainKactors } from "./app/domain";
import { startKActorSystem } from "./infrastructure";
import { servers } from "./servers";

const kafkaBrokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(",") : servers.kafkaBrokers;

startKActorSystem(kafkaBrokers, domainKactors)