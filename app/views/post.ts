import { view } from "../../infrastructure";
import { Post } from "../domain/post";
import { PostMetrics } from "../domain/post-metrics/post-metrics";

export const POST_STORE = 'post_store';

const post = view(Post, (key, state)=>{
    return {
        store: POST_STORE,
        key: key,
        data: {
            userKey: state.userKey,
            content: state.content
        }
    }
})

const metrics = view(PostMetrics, (key, state)=>{
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

export const postViews = [post, metrics]