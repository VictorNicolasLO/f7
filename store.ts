import { startStoreServer } from "./infrastructure";
import { servers } from "./servers";

servers.storeShards.forEach((url) => {
    const port = url.split(":")[2]
    startStoreServer(parseInt(port));
})

