import { createServer } from "node:http2";
import { start } from "node:repl";
import { startHttp2Server } from "./http2-server";
import type { QueryPrepResponse } from './view-handler';
import { createHttp2Client } from "./http2-client";
import { getPartition } from "./utils";
import {
    Level
} from 'level'
import { join } from 'node:path'

// type QueryExecResult = QueryParams | QueryParams[]
export type QueryResult = { key: string, sortKey?: string, data: any }
export type QueryStore = {
    query: (params: QueryParams) => Promise<QueryResult[]>
}

export type QueryParams = {
    store: string,
    type: 'one',
    key: string,
    sortKey?: string,
} | {
    store: string,
    type: 'many',
    limit: number,
    key: string,
    startSortKey?: string,
    reversed?: boolean,
}


// LevelDB instance cache per store
const dbs: { [store: string]: Level<string, any> } = {}

function getDb(store: string) {
    if (!dbs[store]) {
        dbs[store] = new Level<string, any>(join('_storage-files/views', store), { valueEncoding: 'json' })
    }
    return dbs[store]
}

const locks = new Map<string, ((unlock: () => void) => void)[]>();

const lockKey = (key: string) => {
    return new Promise<() => void >((resolve) => {
        const unlock = () => {
            const resolves = locks.get(key);
            if(!resolves)
                return;
            const resol = resolves.pop();
            if (resol) {
                resol(unlock);
            } else {
                locks.delete(key);
            }

        }
        if (!locks.has(key)) {
            locks.set(key, []);
            resolve(unlock);
        }else{
            locks.get(key)?.push(resolve);
        }

    })

}


export const startStoreServerLevel = async (port: number) => {
    await startHttp2Server(port, async (path, payload) => {
        switch (path) {
            case '/store/mutate': {
                const { data, key, store, sortKey } = payload as QueryPrepResponse;
                const db = getDb(store)

                if (!sortKey) {
                    // Merge with existing if present
                    const unlock = await lockKey(key)
                    const prev = await db.get(key)
                    await db.put(key, { ...prev, ...data })
                    unlock()
                } else {
                    // Merge with existing if present
                    
                    const dbKey = `${key}:${sortKey}`
                    const unlock = await lockKey(dbKey)
                    const prev = await db.get(dbKey)
                    await db.put(dbKey, { ...prev, ...data })
                    unlock()
                }
                return { status: 'ok' }
            }
            case '/store/query': {
                const queryParams = payload as QueryParams;
                const db = getDb(queryParams.store)
                if (queryParams.type === 'one') {
                    const { key, sortKey } = queryParams;
                    if (!key)
                        return []
                    if (sortKey) {
                        const dbKey = `${key}:${sortKey}`
                        const content = await db.get(dbKey)
                        if (!content) {

                            return []
                        }
                        return [{ data: content, key, sortKey }] as QueryResult[]

                    } else {
                        const content = await db.get(key)
                        if (!content) {
                            return []
                        }
                        return [{ data: content, key, sortKey: undefined }] as QueryResult[]

                    }
                } else if (queryParams.type === 'many') {
                    const { key, limit, startSortKey, reversed } = queryParams;
                    const prefix = `${key}:`
                    const results: QueryResult[] = []

                  
                   
                 
                    // `${key}:${startSortKey}`
                    
                    // Use a character that is lexicographically greater than any possible sort key
                    for await (const [k, v] of db.iterator({
                        keys: true,
                        values: true,
                        reverse: reversed,
                        limit: limit,
                        ...reversed ? { lte: prefix + (startSortKey || '\uffff'), gt: prefix } : { gte: prefix + (startSortKey || ''), lt: prefix + '\uffff' }
                        
                    })) {
                        const [, sortKey] = k.split(':', 2)
                        results.push({ data: v, key, sortKey })
                        // count++
                        // if (limit && count >= limit) break
                    }
                    return results
                }
            }
        }
    })
}

export const createQueryStore = (storeShards: string[],): QueryStore => {
    const storeClients = storeShards.map((shard) => createHttp2Client(shard))
    return {
        query: async (params: QueryParams) => {
            return (await storeClients[getPartition(params.store, storeShards.length)].request('/store/query', params)) as QueryResult[]
        }
    }
}

