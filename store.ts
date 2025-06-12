import { startStoreServer } from "./infrastructure";
import { startStoreServerLevel } from "./infrastructure/store-server-level";
import { servers } from "./servers";

servers.storeShards.forEach((url) => {
    const port = url.split(":")[2]
    startStoreServerLevel(parseInt(port));
})

