import { view } from "../../infrastructure";
import { UserActive } from "../domain/user-active";


export const ACTIVE_USERS_STORE = 'active_users_store';

const activeUsersView = view(UserActive, (key, state) => {
    return {
        store: ACTIVE_USERS_STORE,
        key: state.username.at(0) || '',
        sortKey: state.username,
        data: {
            userKey: key,
        }
    }
});

export const activeUsersViews = [activeUsersView];