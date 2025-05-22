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

// Helper to parse JSON body from http2 stream
async function parseJsonBody(stream: ServerHttp2Stream): Promise<any> {
    let data = "";
    for await (const chunk of stream) {
        data += chunk;
    }
    return JSON.parse(data);
}

export const startHttp2ApiServer = (store: QueryStore, kActorBus: KActorBus, port: number) => {
    const server = createServer();

    server.on("stream", async (stream, headers) => {
        const method = headers[":method"];
        const path = headers[":path"];
        if (method !== "POST") {
            stream.respond({ ":status": 405 });
            stream.end("Method Not Allowed");
            return;
        }
        // Routing
        const respondJson = (obj: any) => {
            stream.respond({
                "content-type": "application/json",
                ":status": 200
            });
            stream.end(JSON.stringify(obj));
        };
        const respondOk = () => {
            stream.respond({ "content-type": "application/json",":status": 200 });
            stream.end(JSON.stringify({ status: "ok" }));
            
        };
        try {
            if (path === "/api/status") {
                respondOk();
            } else if (path === "/commands/activate-user") {
                const { userKey, username } = await parseJsonBody(stream);
                const dateStr = new Date().toISOString();
                await kActorBus.send((ref) => ref(UserActive, userKey).setActive(dateStr, username));
                respondOk();
            } else if (path === "/commands/post") {
                const { userKey, postKey, content } = await parseJsonBody(stream);
                await kActorBus.send((ref) => ref(Post, postKey).post(userKey, content));
                respondOk();
            } else if (path === "/commands/like") {
                const { userKey, postKey } = await parseJsonBody(stream);
                await kActorBus.send((ref) => ref(Like, `${userKey}|${postKey}`).like());
                respondOk();
            } else if (path === "/commands/view") {
                const { userKey, postKey } = await parseJsonBody(stream);
                await kActorBus.send((ref) => ref(View, `${userKey}|${postKey}`).view());
                respondOk();
            } else if (path === "/commands/comment") {
                const { userKey, postKey, content } = await parseJsonBody(stream);
                await kActorBus.send((ref) => ref(Comment, ulid()).comment(content, postKey, userKey));
                respondOk();
            } else if (path === "/commands/follow") {
                const { userKey, followedKey } = await parseJsonBody(stream);
                await kActorBus.send((ref) => ref(Follower, `${userKey}|${followedKey}`).follow());
                respondOk();
            } else if (path === "/commands/unfollow") {
                const { userKey, followedKey } = await parseJsonBody(stream);
                await kActorBus.send((ref) => ref(Follower, `${userKey}|${followedKey}`).unfollow());
                respondOk();
            } else if (path === "/queries/personal-feed") {
                const { userKey, startSortKey, limit } = await parseJsonBody(stream);
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
                respondJson({ status: 'ok', data: posts });
            } else if (path === "/queries/global-feed") {
                const { startSortKey, limit } = await parseJsonBody(stream);
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
                respondJson({ status: 'ok', data: posts });
            } else if (path === "/queries/comments") {
                const { startSortKey, limit, postKey } = await parseJsonBody(stream);
                const comments = await store.query({
                    store: COMMENTS_STORE,
                    type: 'many',
                    limit,
                    startSortKey,
                    key: postKey,
                });
                respondJson({ status: 'ok', data: comments });
            } else if (path === "/queries/active-users") {
                const { limit, postKey, textSearch } = await parseJsonBody(stream);
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
                respondJson({ status: 'ok', data: activeUsers });
            } else if (path === "/queries/user-timeline") {
                const { startSortKey, limit, userKey } = await parseJsonBody(stream);
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
                respondJson({ status: 'ok', data: posts });
            } else {
                stream.respond({ ":status": 404 });
                stream.end("Not Found");
            }
        } catch (err: any) {
            stream.respond({ ":status": 500 });
            stream.end("Internal Server Error: " + err.message);
        }
    });

    server.listen(port);
    console.log(`HTTP2 server listening on port ${port}`);
    return server;
};
