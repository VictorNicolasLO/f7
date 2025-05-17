import { Actor } from "../../../infrastructure";
import { Follower } from "../follower/follower";
export type FollowersChunkState = {
    followers: string[]
}

const FOLLOWED_PART_KEY = 0
const CHUNK_PART_KEY = 1

export class FollowersChunk extends Actor {
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
}