import { Actor } from "../../../infrastructure"
import { PostMetrics } from "../post-metrics/post-metrics"

export type LikeState = {
    active: boolean
}

const USER_PART = 0
const POST_PART = 1

export class Like extends Actor{
    state!: LikeState

    like() {
        const postKey = this.key.split('|')[POST_PART]
        if(!this.state){
            this.state = {
                active: true
            }
            this.ref(PostMetrics, postKey).incrementLikes()
        } else {
            const isActive = !this.state.active
            this.state.active = isActive
            if(isActive)
                this.ref(PostMetrics, postKey).incrementLikes()
            else
                this.ref(PostMetrics, postKey).decrementLikes()
        }
    }

}