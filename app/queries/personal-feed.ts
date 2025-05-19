import { query } from "../../infrastructure";

import { FEED_STORE } from "../views/feed";
import { POST_STORE } from "../views/post";

export type PersonalFeedQueryArgs = {
    page: number;
    limit: number;
    userKey: string;
}

export const personalFeedQuery = query<PersonalFeedQueryArgs>((queryArgs)=>({
    store: FEED_STORE,
    type: 'many',
    limit: queryArgs.limit,
    page: queryArgs.page,
    key: queryArgs.userKey,
})).thenQuery((queryArgs, result) => result.map(({ sortKey: postKey})=> ({
    store: POST_STORE,
    type: 'one',
    key: postKey,
}))).done()