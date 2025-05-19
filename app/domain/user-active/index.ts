import { KActor } from "../../../infrastructure"


export type UserActiveState = {
    lastLogin: Date, username:string
}

export class UserActive extends KActor {
    state!: UserActiveState

    setActive(date: Date, username: string) {
        this.state = {
            lastLogin: date,
            username
        }
    }
}