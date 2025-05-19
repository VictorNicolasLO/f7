import { query } from "../../infrastructure";
import { Post } from "../domain/post";
import { FEED_STORE } from "../views/feed";
import { POST_STORE } from "../views/post";

export type GlobalFeedQuery = {
    page: number;
    limit: number;
}

export const globalFeedQuery = query<GlobalFeedQuery>((queryArgs)=>({
    store: FEED_STORE,
    type: 'many',
    limit: queryArgs.limit,
    page: queryArgs.page,
    key: 'global',
})).thenQuery((_queryArgs, result) => result.map(({sortKey :postKey})=> ({
    store: POST_STORE,
    type: 'one',
    key: postKey,
}))).done()