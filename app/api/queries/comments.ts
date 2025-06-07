import type { QueryResult, QueryStore } from "../../../infrastructure";
import { ACTIVE_USERS_BY_KEY_STORE } from "../../views";

export const commentsWithUsers = async (comments: QueryResult[], store: QueryStore) => {

    const commentByUserId = Object.groupBy(comments, comment => comment.data.userKey);
    const users = await Promise.all(Object.keys(commentByUserId).map(async userKey => {
        const userData = await store.query({
            store: ACTIVE_USERS_BY_KEY_STORE,
            type: 'one',
            key: userKey,
        });
        return {
            userKey,
            username: userData[0] ? userData[0].data.username : 'Unknown User',
        };
    }));
    const commentsWithUserName = comments.map((comments, index) => {
        const userKey = comments?.data.userKey;
        const user = users.find(u => u.userKey === userKey);
        return {
            ...comments,
            data: {
                ...comments.data,
                username: user ? user.username : 'Unknown User',
            }
        };
    });
    return commentsWithUserName
}