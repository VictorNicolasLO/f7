export * from './active-users';
export * from './comments';
export * from './feed';
export * from './followed';
export * from './followers';
export * from './post';
export * from './user-timeline';
export * from  './user-post-interaction'

// Array of all views
import { activeUsersView, activeUsersByKeyView } from './active-users';
import { commentView } from './comments';
import {  userFeedView } from './feed';
import { followedView } from './followed';
import { followerView } from './followers';
import { post, metrics } from './post';
import { timeline } from './user-timeline';
import {likes,views} from './user-post-interaction';
export const allViews = [ // IMPORTANT keep the order of the views
    activeUsersView,
    commentView,
    // globalFeedView,
    userFeedView,
    followedView,
    followerView,
    post,
    metrics,
    timeline,
    activeUsersByKeyView,
    likes,
    views
];