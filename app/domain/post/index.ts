import { KActor } from "../../../infrastructure"
import { FeedItem } from "../feed-item/feed-item"
import { FollowersChunk } from "../followers-chunk"
import { UserFollowers } from "../user-followers/user-followers"

export type PostState = {
    userKey: string
    content: string
}

export class Post extends KActor{
    state!: PostState

    post(userKey: string, content: string) {
        if(this.state)
            return
        this.ref(UserFollowers, userKey).fanout(this.key)
        this.ref(FeedItem, `global|${this.key}`).create()
    }
}