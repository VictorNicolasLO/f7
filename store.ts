import { startStoreServer } from "./infrastructure";
import { startStoreServerLevel } from "./infrastructure/store-server-level";
import { servers } from "./servers";

const storeShards = process.env.STORE_SHARDS ? process.env.STORE_SHARDS.split(",") : servers.storeShards;
storeShards.forEach((url) => {
    const port = url.split(":")[2]
    startStoreServer(parseInt(port));
})

