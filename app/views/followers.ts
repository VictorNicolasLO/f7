import { view } from "../../infrastructure";
import { Follower } from "../domain/follower/follower";

// filepath: /Users/victornicolaslizarragaochoa/projects/flash7/app/views/followers.ts

export const FOLLOWERS_STORE = 'followers_store';

export const followerView = view(Follower, (key, state) => {
    // key format: followerId|followedId
    if (!state)
        return
    const [followerId, followedId] = key.split('|');
    return {
        store: FOLLOWERS_STORE,
        key: followerId,
        sortKey: followedId,
        data: {
            active: state.active,
        }
    }
});
