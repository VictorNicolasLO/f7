import { KActor } from "../../../infrastructure"


export type UserActiveState = {
    lastLogin: string, username:string
}

export class UserActive extends KActor {
    state!: UserActiveState

    setActive(date: string, username: string) {
        this.state = {
            lastLogin: date,
            username
        }
    }
}