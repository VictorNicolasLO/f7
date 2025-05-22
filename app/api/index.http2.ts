import { ulid } from "ulid"
import type { KActorBus, QueryStore } from "../../infrastructure"
import { Comment } from "../domain/comment/comment"
import { Follower } from "../domain/follower/follower"
import { Like } from "../domain/like/like"
import { Post } from "../domain/post"
import { UserActive } from "../domain/user-active"
import { View } from "../domain/view"
import { ACTIVE_USERS_STORE } from "../views/active-users"
import { COMMENTS_STORE } from "../views/comments"
import { FEED_STORE } from "../views/feed"
import { FOLLOWERS_STORE } from "../views/followers"
import { POST_STORE } from "../views/post"
import { USER_TIMELINE } from "../views/user-timeline"
import { createServer, type ServerHttp2Stream } from "node:http2";
import { startHttp2Server } from "../../infrastructure/http2-server"

// Helper to parse JSON body from http2 stream
async function parseJsonBody(stream: ServerHttp2Stream): Promise<any> {
    let data = "";
    for await (const chunk of stream) {
        data += chunk;
    }
    return JSON.parse(data);
}

export const startHttp2ApiServer = async (store: QueryStore, kActorBus: KActorBus, port: number) => {
    await startHttp2Server(port, async (path: string, data: any) => {
        if (path === "/api/status") {
            return {status: "ok"};
        } else if (path === "/commands/activate-user") {
            const { userKey, username } = data;
            const dateStr = new Date().toISOString();
            await kActorBus.send((ref) => ref(UserActive, userKey).setActive(dateStr, username));
            {status: "ok"}
        } else if (path === "/commands/post") {
            const { userKey, postKey, content } = data;
            await kActorBus.send((ref) => ref(Post, postKey).post(userKey, content));
            {status: "ok"}
        } else if (path === "/commands/like") {
            const { userKey, postKey } = data;
            await kActorBus.send((ref) => ref(Like, `${userKey}|${postKey}`).like());
            {status: "ok"}
        } else if (path === "/commands/view") {
            const { userKey, postKey } = data;
            await kActorBus.send((ref) => ref(View, `${userKey}|${postKey}`).view());
            {status: "ok"}
        } else if (path === "/commands/comment") {
            const { userKey, postKey, content } = data;
            await kActorBus.send((ref) => ref(Comment, ulid()).comment(content, postKey, userKey));
            {status: "ok"}
        } else if (path === "/commands/follow") {
            const { userKey, followedKey } = data;
            await kActorBus.send((ref) => ref(Follower, `${userKey}|${followedKey}`).follow());
            {status: "ok"}
        } else if (path === "/commands/unfollow") {
            const { userKey, followedKey } = data;
            await kActorBus.send((ref) => ref(Follower, `${userKey}|${followedKey}`).unfollow());
            {status: "ok"}
        } else if (path === "/queries/personal-feed") {
            const { userKey, startSortKey, limit } = data;
            const postKeys = await store.query({
                store: FEED_STORE,
                type: 'many',
                limit,
                startSortKey,
                key: userKey,
            });
            const posts = await Promise.all(postKeys.map(({ sortKey }: any) => store.query({
                store: POST_STORE,
                type: 'one',
                key: sortKey!,
            })));
            return { status: 'ok', data: posts };
        } else if (path === "/queries/global-feed") {
            const { startSortKey, limit } = data;
            const postKeys = await store.query({
                store: FEED_STORE,
                type: 'many',
                limit,
                startSortKey,
                key: 'global',
            });
            const posts = await Promise.all(postKeys.map(({ sortKey }: any) => store.query({
                store: POST_STORE,
                type: 'one',
                key: sortKey!,
            })));
            return { status: 'ok', data: posts };
        } else if (path === "/queries/comments") {
            const { startSortKey, limit, postKey } = data;
            const comments = await store.query({
                store: COMMENTS_STORE,
                type: 'many',
                limit,
                startSortKey,
                key: postKey,
            });
            return { status: 'ok', data: comments };
        } else if (path === "/queries/active-users") {
            const { limit, postKey, textSearch } = data;
            const users = await store.query({
                store: ACTIVE_USERS_STORE,
                type: 'many',
                limit,
                key: postKey,
                startSortKey: textSearch
            });
            const activeUsers = await Promise.all(users.map(async ({ data, sortKey }: any) => {
                const followData = await store.query({
                    store: FOLLOWERS_STORE,
                    type: 'one',
                    key: data.userKey,
                });
                const isFollowing = followData[0] ? followData[0].data.active : false;
                return {
                    userKey: data.userKey,
                    username: sortKey,
                    isFollowing
                };
            }));
            return { status: 'ok', data: activeUsers };
        } else if (path === "/queries/user-timeline") {
            const { startSortKey, limit, userKey } = data;
            const postKeys = await store.query({
                store: USER_TIMELINE,
                type: 'many',
                limit,
                startSortKey,
                key: userKey,
            });
            const posts = await Promise.all(postKeys.map(({ sortKey }: any) => store.query({
                store: POST_STORE,
                type: 'one',
                key: sortKey!,
            })));
            return { status: 'ok', data: posts };
        } else {
            return { ":status": 404 }
        }
    })



};
