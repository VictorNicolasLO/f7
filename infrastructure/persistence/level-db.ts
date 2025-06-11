

import {
    Level,
    
} from 'level'
import type {BatchOperation} from 'level'
const getLevelDBStore = (
    basePath: string,
    topic: string,
    partition: number
) => {

    const leveldb = new Level<string, any>(`${basePath}/${topic}/${partition}`, {
        valueEncoding: 'json',
        
    })
    
    return {
        setMany: async (kv: any) => {
            const operations: (BatchOperation<Level<string, string>, string, string>)[] = []
            for (const key in kv) { 
                operations.push({ type: 'put', key: key, value: kv[key] })
            }
            void await leveldb.batch(operations)
        },
        getMany: async (keys: string[]) => {
            const values = await leveldb.getMany(keys)
            return values
        },
        connect: async () => {
            await leveldb.open()
        } ,
        disconnect: async () => {
            await leveldb.close()
        },
        get: async (key: string) => {
            const value = await leveldb.get(key)
            if (!value) return undefined
            return value
        },
        setManyRaw: async (kv: any) => {
            const operations: (BatchOperation<Level<string, string>, string, string>)[] = []
            for (const key in kv) { 
                operations.push({ type: 'put', key: key, value: JSON.parse(kv[key] ) })
            }
            void await leveldb.batch(operations)
        }
    }
}

export const createLevelDBStore = (
    basePath: string,
) => {
    return {
        getStore: (topic:string, partition: number)=> getLevelDBStore(basePath, topic, partition),
    }
}