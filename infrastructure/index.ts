export * from './kactor'
export * from './view-handler'
export * from './store-server'

type QueryResult<T> = {
    clz: new () => T,
    fn: (key: string) => T,
}








// export const query = <T>(queryExec:(queryArgs: T)=> QueryExecResult)=> {
//     const steps: any[] = [queryExec]
//     const done = ()=> ({
//         steps
//     })
//     const thenQuery = (nextQueryExec:(queryArgs: T, results: { key:string, sortKey: string, data: any }[])=> QueryExecResult)=>{
//         steps.push(nextQueryExec)
//         return {
//             thenQuery,
//             done
//         }
//     }

//     return {
//         thenQuery,
//         done,
//     }
// } 


