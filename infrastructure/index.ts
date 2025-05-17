export abstract class Actor {
    key!:string
    ref<T>(clz: new ()=> T, key: string): Pick<T, Exclude<keyof T,  "state" | "ref">> {
        return new clz()
    }
}