import { createServer } from "node:http2";
import { start } from "node:repl";
import Btree from 'sorted-btree'
import { startHttp2Server } from "./http2-server";
import type { QueryPrepResponse } from './view-handler';
import { createHttp2Client } from "./http2-client";
import { getPartition } from "./utils";


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


const storeData: {
    [store: string]: {
        [key: string]: { item?: any, btree?: Btree<any, any> }
    } | undefined
} = {}

const getBtreeReversed = (btree: Btree<any, any>, highestKey: string | undefined, limit?: number) => {

    const entries: [any, any][] = []
    for (let pair of btree.entriesReversed(highestKey)) {
        entries.push(pair);
        if (limit && entries.length >= limit) {
            return entries;
        }
    }
    return entries

}

export const startStoreServer = async (port: number) => {
    await startHttp2Server(port, async (path, payload) => {
        switch (path) {
            case '/store/mutate': {
                const { data, key, store, sortKey } = payload as QueryPrepResponse;
                if (!storeData[store]) {
                    storeData[store] = {};
                }
                if (!storeData[store][key]) {
                    storeData[store][key] = {};
                }
                if (!sortKey) {
                    storeData[store][key].item = { ...storeData[store][key].item, ...data };
                }
                else {
                    if (!storeData[store][key].btree) {
                        storeData[store][key].btree = new Btree();
                    }
                    const val = storeData[store][key].btree.get(sortKey, undefined)
                    storeData[store][key].btree.set(sortKey, {
                        ...val,
                        ...data
                    });
                }
                return { status: 'ok' }
            }
            case '/store/query': {
                const queryParams = payload as QueryParams;
                if (queryParams.type === 'one') {
                    const { store, key, sortKey } = queryParams;
                    if (!storeData[store]) {
                        return [] as QueryResult[]
                    }
                    if (!storeData[store][key]) {
                        return [] as QueryResult[]
                    }
                    if (sortKey) {
                        if (storeData[store][key].btree) {
                            const content = storeData[store][key].btree.get(sortKey)
                            return [{
                                data: content,
                                key: key,
                                sortKey: sortKey
                            }] as QueryResult[]
                        } else {
                            return [] as QueryResult[]
                        }

                    } else {
                        if (storeData[store][key].item) {
                            return [{
                                data: storeData[store][key].item,
                                key: key,
                                sortKey: undefined
                            }] as QueryResult[]
                        } else {
                            return [] as QueryResult[]
                        }
                    }
                } else if (queryParams.type === 'many') {
                    const { store, key, limit, startSortKey, reversed } = queryParams;
                    if (!storeData[store]) {
                        return [] as QueryResult[]
                    }
                    if (!storeData[store][key]) {
                        return [] as QueryResult[]
                    }
                    const btree = storeData[store][key].btree;
                    if (!btree) {
                        return [] as QueryResult[]
                    }


                    if (startSortKey) {
                        const items = reversed ? getBtreeReversed(btree, startSortKey, limit) : btree.getRange(startSortKey, btree.maxKey(), true, limit);
                        return items.map(([sk, v]) => {
                            return {
                                data: v,
                                key: key,
                                sortKey: sk,
                            } as QueryResult
                        })
                    } else {
                        const items =reversed ? getBtreeReversed(btree, startSortKey, limit) : btree.getRange(btree.minKey(), btree.maxKey(), true, limit);
                        return items.map(([sk, v]) => {
                            return {
                                data: v,
                                key: key,
                                sortKey: sk,
                            } as QueryResult
                        })
                    }
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

