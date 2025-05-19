import { view } from "../../infrastructure";
import { Follower } from "../domain/follower/follower";

// filepath: /Users/victornicolaslizarragaochoa/projects/flash7/app/views/followers.ts

export const FOLLOWED_STORE = 'followed_store';

const followerView = view(Follower, (key, state) => {
    // key format: followerId|followedId
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

export const followersViews = [followerView];