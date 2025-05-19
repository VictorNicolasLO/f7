import { KActor } from "../../../infrastructure"

export type FeedItemState = Boolean

export class FeedItem extends KActor {
    state!: FeedItemState

    create() { 
        if (!this.state) {
            this.state = true
        }
    }
}