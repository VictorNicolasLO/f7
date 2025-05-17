import { Actor } from "../../../infrastructure"
import { FollowersChunk } from "../followers-chunk"
import { PostMetrics } from "../post-metrics/post-metrics"
import { UserFollowers } from "../user-followers/user-followers"


export type FollowerState = {
    active: boolean,
    chunkKey?: string,
}

const FOLLOWER_PART_KEY = 0
const FOLLOWED_PART_KEY = 1

export class Follower extends Actor {
    state!: FollowerState

    follow() {
        if(this.state && this.state.active)
            return
        const keys = this.key.split('|')
        const followerKey = keys[FOLLOWER_PART_KEY]
        const followedKey = keys[FOLLOWED_PART_KEY]
        if (!this.state) {
            this.state = {
                active: true
            }
        }else {
            this.state.active = true
        }
        this.ref(UserFollowers, followedKey).addFollower(followerKey)

    }

    setChunkKey(chunkKey: string) {
        const keys = this.key.split('|')
        const followerKey = keys[FOLLOWER_PART_KEY]
        const followedKey = keys[FOLLOWED_PART_KEY]
        if(this.state.active)
            this.state.chunkKey = this.state.chunkKey
        else
            this.ref(UserFollowers, followedKey).removeFollower(followerKey, chunkKey)
    }
    
    unfollow() {
        if(!this.state || !this.state.active)
            return
        const keys = this.key.split('|')
        const followerKey = keys[FOLLOWER_PART_KEY]
        const followedKey = keys[FOLLOWED_PART_KEY]
        this.state.active = false
        if(this.state.chunkKey) 
            this.ref(UserFollowers, followedKey).removeFollower(followerKey, this.state.chunkKey)
    }
}