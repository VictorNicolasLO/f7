import { KActor } from "../../../infrastructure"
import { PostMetrics } from "../post-metrics/post-metrics"

// filepath: /Users/victornicolaslizarragaochoa/projects/flash7/app/KActors/comment/comment.ts

export type CommentState = {
    content: string,
    postKey: string,
    userKey: string
}

export class Comment extends KActor {
    state!: CommentState

    comment(content: string, postKey: string, userKey: string) {

        if (!this.state) {
            this.state = {
                content,
                postKey,
                userKey
            }
            this.ref(PostMetrics, postKey).incrementComments()
        }
    }
}