import { Actor } from "../../../infrastructure"
import { PostMetrics } from "../post-metrics/post-metrics"

// filepath: /Users/victornicolaslizarragaochoa/projects/flash7/app/actors/view/index.ts

export type ViewState = Boolean

export class View extends Actor {
    state!: ViewState

    view() {
        const postKey = this.key.split('|')[1]
        if (!this.state) {
            this.state = true
            this.ref(PostMetrics, postKey).incrementViews()
        }
    }
}