import { view } from "../../infrastructure";
import { Like, View } from "../domain";

export const USER_POST_INTERACTION_STORE = 'user_post_interaction_store';

export const likes = view(Like, (key, state)=>{
    return {
        store: USER_POST_INTERACTION_STORE,
        key: key,
        data: {
            like: state.active
        }
    }
})

export const views = view(View, (key, state)=>{
    return {
        store: USER_POST_INTERACTION_STORE,
        key: key,
        data: {
            view: state
        }
    }
})