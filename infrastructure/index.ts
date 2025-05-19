import { Post } from "../app/domain/post"

export abstract class KActor {
    key!:string
    ref<T>(clz: new ()=> T, key: string): Pick<T, Exclude<keyof T,  "state" | "ref">> {
        return new clz()
    }
}

export type QueryPrepResponse = {
    store: string,
    key: string,
    sortKey?: string,
    data: any,
}

type QueryResult<T> = {
    clz: new () => T,
    fn: (key: string) => T,
}



export const view = <T extends {state: unknown}>(clz: new ()=>T, viewExec: (key: string, state: T['state'] )=> QueryPrepResponse) => {

}


export type QueryParams = {
    store: string,
    type: 'one',
    key: string,
    sortKey?: string,
} | {
    store: string,
    type: 'one' | 'many',
    limit: number,
    key: string,
    page: number,
}
type QueryExecResult = QueryParams | QueryParams[]
export const query = <T>(queryExec:(queryArgs: T)=> QueryExecResult)=> {
    const steps: any[] = [queryExec]
    const done = ()=> ({
        steps
    })
    const thenQuery = (nextQueryExec:(queryArgs: T, results: { key:string, sortKey: string, data: any }[])=> QueryExecResult)=>{
        steps.push(nextQueryExec)
        return {
            thenQuery,
            done
        }
    }

    return {
        thenQuery,
        done,
    }
} 