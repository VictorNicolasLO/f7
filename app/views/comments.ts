import { view } from "../../infrastructure";
import { Comment } from "../domain/comment/comment";

export const COMMENTS_STORE = 'comments_store';

export const commentView = view(Comment, (key, state) => {
   
    return {
        store: COMMENTS_STORE,
        key: state.postKey,
        sortKey: key,
        data: {
            content: state.content,
            userKey: state.userKey,
            postKey: state.postKey
        }
    }
});

