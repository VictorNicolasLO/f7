import { server } from "typescript";
import { startViewHandler } from "./infrastructure";
import { servers } from "./servers";
import { allViews } from "./app/views";
import { domainKactors } from "./app/domain";

startViewHandler(servers.kafkaBrokers, servers.storeShards, allViews, domainKactors)