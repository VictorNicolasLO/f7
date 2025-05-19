import { view } from "../../infrastructure";
import { Post } from "../domain/post";

export const USER_TIMELINE = 'user_timeline';

const timeline = view(Post, (key, state) => {

    return {
        store: USER_TIMELINE,
        key: state.userKey,
        sortKey: key,
        data: null
    }
});

export const timelineViews = [timeline]