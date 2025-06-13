import { KActor } from "../../../infrastructure";
import { FollowersChunk } from "../followers-chunk";

export type UserFollowersState = {
    followersCount: number,
    followingCount: number,
    maxChunk: number,
    incompleteChunks: Record<string, number>
}
const CHUNK_SIZE = 100

export class UserFollowers extends KActor {
    state!: UserFollowersState


    addFollower(followerKey: string) {
        const userKey = this.key
        if (this.state) {
            this.state.followersCount += 1
        } else {
            this.state = {
                followersCount: 1,
                followingCount: 0,
                maxChunk: 0,
                incompleteChunks: {}
            }
        }
        const incompleteChunks = this.state.incompleteChunks
        const incompleteChunksKeys = Object.keys(incompleteChunks)
        if(incompleteChunksKeys.length > 0) {
            const chunkKey = incompleteChunksKeys[0]
            this.ref(FollowersChunk, chunkKey).addFollower(followerKey)
            this.state.incompleteChunks[chunkKey] -= 1
            if(this.state.incompleteChunks[chunkKey] === 0) {
                delete this.state.incompleteChunks[chunkKey]
            }
        }else {
            const chunkNumber = Math.floor(this.state.followersCount / CHUNK_SIZE)
            if (chunkNumber > this.state.maxChunk) {
                this.state.maxChunk = chunkNumber
            }
            const chunkKey = `${userKey}|${chunkNumber}`
            this.ref(FollowersChunk, chunkKey).addFollower(followerKey)
        }
    }


    removeFollower(followerKey: string, chunkKey: string) {
        if(!this.state)
            return
        this.state.followersCount -= 1
        this.state.incompleteChunks[chunkKey] = (this.state.incompleteChunks[chunkKey] || 0) + 1
        this.ref(FollowersChunk, chunkKey).removeFollower(followerKey)
    }

    fanout(postKey: string) {
        const userKey = this.key
        const chunkNumber = 0
        const chunkKey = `${userKey}|${chunkNumber}`
        if(this.state)
            this.ref(FollowersChunk, chunkKey).fanout(postKey, this.state.maxChunk)
    }

}