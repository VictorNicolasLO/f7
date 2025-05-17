import { Actor } from "../../../infrastructure"

export type PostState = {
    userKey: string
    content: string
}

export class Post extends Actor{
    state!: PostState

    post(userKey: string, content: string) {
        if(!this.state)
            this.state = {
                userKey,
                content
            }
    }
}