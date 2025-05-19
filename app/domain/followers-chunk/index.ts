import { KActor } from "../../../infrastructure";
import { FeedItem } from "../feed-item/feed-item";
import { Follower } from "../follower/follower";
export type FollowersChunkState = {
    followers: string[]
}

const USER_PART_KEY = 0
const CHUNK_PART_KEY = 1

export class FollowersChunk extends KActor {
    state!: FollowersChunkState

    addFollower(followerKey: string) {
        if (this.state) {
            this.state.followers.push(followerKey)
        } else {
            this.state = {
                followers: [followerKey]
            }
        }
        this.ref(Follower, followerKey).setChunkKey(this.key)
    }

    removeFollower(followerKey: string) {
        if (this.state) {
            this.state.followers = this.state.followers.filter(f => f !== followerKey)
        }
    }

    fanout(postKey: string, maxChunk: number) {
        this.state.followers.forEach(followerKey => this.ref(FeedItem, `${followerKey}|${postKey}`).create())
        const keys = this.key.split('|')
        const userKey = keys[USER_PART_KEY]
        const chunkNumber = parseInt(keys[CHUNK_PART_KEY])
        if (chunkNumber >= maxChunk) {
            return
        }
        const nextChunkKey = `${userKey}|${chunkNumber + 1}`
        this.ref(FollowersChunk, nextChunkKey).fanout(postKey, maxChunk)
    }
}