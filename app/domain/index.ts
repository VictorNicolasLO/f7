import { Comment } from "./comment/comment";
import { FeedItem } from "./feed-item/feed-item";
import { Follower } from "./follower/follower";
import { FollowersChunk } from "./followers-chunk";
import { Like } from "./like/like";
import { Post } from "./post";
import { PostMetrics } from "./post-metrics/post-metrics";
import { UserActive } from "./user-active";
import { UserFollowers } from "./user-followers/user-followers";
import { View } from "./view";

// filepath: /Users/victornicolaslizarragaochoa/projects/flash7/app/domain/index.ts

export { Comment } from "./comment/comment";
export { FeedItem } from "./feed-item/feed-item";
export { Follower } from "./follower/follower";
export { FollowersChunk } from "./followers-chunk";
export { Like } from "./like/like";
export { Post } from "./post";
export { PostMetrics } from "./post-metrics/post-metrics";
export { UserActive } from "./user-active";
export { UserFollowers } from "./user-followers/user-followers";
export { View } from "./view";

// Import all domain kactors

// Export as array
export const domainKactors = [
    Comment,
    FeedItem,
    Follower,
    FollowersChunk,
    Like,
    Post,
    PostMetrics,
    UserActive,
    UserFollowers,
    View,
];