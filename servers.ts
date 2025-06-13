import { startMemoryUsage } from "./infrastructure/perf"

export const servers = {
    kafkaBrokers:['localhost:9094'],
    api: 'http://localhost:8001',
    storeShards:  ['http://localhost:3001']
    
}

startMemoryUsage()