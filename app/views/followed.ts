import { view } from "../../infrastructure";
import { Follower } from "../domain/follower/follower";

// filepath: /Users/victornicolaslizarragaochoa/projects/flash7/app/views/followers.ts

export const FOLLOWED_STORE = 'followed_store';

export const followedView = view(Follower, (key, state) => {
    // key format: followerId|followedId
    if (!state)
        return
    const [followerKey, followedKey] = key.split('|');
    return {
        store: FOLLOWED_STORE,
        key: followedKey,
        sortKey: followerKey,
        data: {
            active: state.active,
        }
    }
});

