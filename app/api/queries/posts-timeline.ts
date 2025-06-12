import type { QueryResult, QueryStore } from "../../../infrastructure";
import { ACTIVE_USERS_BY_KEY_STORE, POST_STORE, USER_POST_INTERACTION_STORE } from "../../views";

export const postsWithUsersAndInteractions = async (postKeys: QueryResult[], store: QueryStore, userIdB64: string) => {
    const interationsPromise = Promise.all(postKeys.map(({ sortKey }) => store.query({
        store: USER_POST_INTERACTION_STORE,
        type: 'one',
        key: `${userIdB64}|${sortKey}`,
    })));
    const posts = await Promise.all(postKeys.map(({ sortKey }) => store.query({
        store: POST_STORE,
        type: 'one',
        key: sortKey!,
    })));
    const postsByUserId = Object.groupBy(posts, post => post[0]?.data.userKey);
    const users = await Promise.all(Object.keys(postsByUserId).map(async userKey => {
        const userData = await store.query({
            store: ACTIVE_USERS_BY_KEY_STORE,
            type: 'one',
            key: userKey,
        });
        return {
            userKey,
            username: userData[0] && userData[0].data ? userData[0].data.username : 'Unknown User',
        };
    }));
    const postsWithUsernames = posts.map((post, index) => {
        const userKey = post[0]?.data.userKey;
        const user = users.find(u => u.userKey === userKey);
        return {
            ...post[0],
            data: {
                ...post[0].data,
                username: user ? user.username : 'Unknown User',
            }
        };
    });
    const interactions = await interationsPromise;
    const postWithuserNamesAndResults = interactions.map((interaction, index) => {
        if (interaction[0]) {
            postsWithUsernames[index].data.hasLike = interaction[0].data.like || false;
            postsWithUsernames[index].data.hasView = interaction[0].data.view || false;
        } else {
            postsWithUsernames[index].data.hasLike = false;
            postsWithUsernames[index].data.hasView = false;
        }
        return postsWithUsernames[index];
    });
    return postWithuserNamesAndResults
}