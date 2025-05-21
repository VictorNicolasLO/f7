import { view } from "../../infrastructure";
import { FeedItem } from "../domain/feed-item/feed-item";

export const FEED_STORE = 'feed_store';

const USER_PART_KEY = 0
const POST_PART_KEY = 1

export const globalFeedView = view(FeedItem, (key) => {
    const postKey = key.split('|')[POST_PART_KEY]
    console.log(key)
    return {
        store: FEED_STORE,
        key: 'global',
        sortKey: postKey,
        data: null
    }
});

export const userFeedView = view(FeedItem, (key) => {
    const keys = key.split('|')
    const postKey = keys[POST_PART_KEY]
    const userKey = keys[USER_PART_KEY]
    return {
        store: FEED_STORE,
        key: userKey,
        sortKey: postKey,
        data: null
    }
});
