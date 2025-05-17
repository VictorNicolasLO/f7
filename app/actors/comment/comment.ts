import { Actor } from "../../../infrastructure"
import { PostMetrics } from "../post-metrics/post-metrics"

// filepath: /Users/victornicolaslizarragaochoa/projects/flash7/app/actors/comment/comment.ts

export type CommentState = {
    content: string
}

const USER_PART_KEY = 0
const POST_PART_KEY = 1

export class Comment extends Actor {
    state!: CommentState

    comment(content: string) {
        const postKey = this.key.split('|')[POST_PART_KEY]
        if (!this.state) {
            this.state = {
                content
            }
            this.ref(PostMetrics, postKey).incrementComments()
        }
    }
}