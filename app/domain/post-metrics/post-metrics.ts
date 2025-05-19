import { KActor } from "../../../infrastructure"

// filepath: /Users/victornicolaslizarragaochoa/projects/flash7/app/KActors/post-metrics/post-metrics.ts

export type PostMetricsState = {
    likeCount: number
    commentCount: number
    shareCount: number
    viewsCount: number
}
const defaultState: PostMetricsState = {
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewsCount: 0
}

export class PostMetrics extends KActor {
    state!: PostMetricsState

    incrementLikes() {
        if (this.state) {
            this.state.likeCount += 1
        } else {
            this.state = {
                ...defaultState,
                likeCount: 1,
            }
        }

    }

    incrementComments() {
        if (this.state) {
            this.state.commentCount += 1
        } else {
            this.state = {
                ...defaultState,
                commentCount: 1,
            }
        }
    }
    incrementShares() {
        if (this.state) {
            this.state.shareCount += 1
        } else {
            this.state = {
                ...defaultState,
                shareCount: 1,

            }
        }
    }
    incrementViews() {
        if (this.state) {
            this.state.viewsCount += 1
        } else {
            this.state = {
                ...defaultState,
                viewsCount: 1
            }
        }
    }

    decrementLikes() {
        if (this.state && this.state.likeCount > 0) {
            this.state.likeCount -= 1
        }
    }
    decrementComments() {
        if (this.state && this.state.commentCount > 0) {
            this.state.commentCount -= 1
        }
    }
    decrementShares() {
        if (this.state && this.state.shareCount > 0) {
            this.state.shareCount -= 1
        }
    }
    decrementViews() {
        if (this.state && this.state.viewsCount > 0) {
            this.state.viewsCount -= 1
        }
    }
}