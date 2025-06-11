import { view } from "../../infrastructure";
import { UserActive } from "../domain/user-active";


export const ACTIVE_USERS_STORE = 'active_users_store';
export const ACTIVE_USERS_BY_KEY_STORE = 'active_users_by_key_store'

export const activeUsersView = view(UserActive, (key, state) => {
    return {
        store: ACTIVE_USERS_STORE,
        key: state.username.toLowerCase().at(0) || '',
        sortKey: state.username.toLowerCase(),
        data: {
            userKey: key,
            username: state.username,
        }
    }
});

export const activeUsersByKeyView = view(UserActive, (key, state) => {
    return {
        store: ACTIVE_USERS_BY_KEY_STORE,
        key:  key,
        data: {
            username: state.username,
        }
    }
});