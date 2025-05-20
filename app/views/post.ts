import { view } from "../../infrastructure";
import { Post } from "../domain/post";
import { PostMetrics } from "../domain/post-metrics/post-metrics";

export const POST_STORE = 'post_store';

export const post = view(Post, (key, state)=>{
    return {
        store: POST_STORE,
        key: key,
        data: {
            userKey: state.userKey,
            content: state.content
        }
    }
})

export const metrics = view(PostMetrics, (key, state)=>{
    return {
        store: POST_STORE,
        key: key,
        data: {
            likes: state.likeCount,
            comments: state.commentCount,
            shares: state.shareCount,
            views: state.viewsCount
        }
    }
})

