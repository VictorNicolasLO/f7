// TypeScript version of the Node.js server in index.node.js
import http, { IncomingMessage, ServerResponse } from 'http';
import { ulid } from 'ulid';
import { Comment } from '../domain/comment/comment';
import { Follower } from '../domain/follower/follower';
import { Like } from '../domain/like/like';
import { Post } from '../domain/post';
import { UserActive } from '../domain/user-active';
import { View } from '../domain/view';
import { ACTIVE_USERS_STORE } from '../views/active-users';
import { COMMENTS_STORE } from '../views/comments';
import { FEED_STORE } from '../views/feed';
import { FOLLOWERS_STORE } from '../views/followers';
import { POST_STORE } from '../views/post';
import { USER_TIMELINE } from '../views/user-timeline';
import type { KActorBus, QueryStore } from '../../infrastructure';

function parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); } catch (e) { resolve({}); }
        });
        req.on('error', reject);
    });
}

function sendJson(res: ServerResponse, obj: any) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
}

function sendOk(res: ServerResponse) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
}

export function startServer(store: QueryStore, kActorBus: KActorBus, port: number) {
    const server = http.createServer(async (req, res) => {
        if (req.method === 'GET' && req.url === '/api/status') {
            sendOk(res);
            return;
        }
        if (req.method === 'POST') {
            switch (req.url) {
                case '/commands/activate-user': {
                    const { userKey, username } = await parseBody(req);
                    const dateStr = new Date().toISOString();
                    await kActorBus.send((ref: any) => ref(UserActive, userKey).setActive(dateStr, username));
                    sendOk(res);
                    break;
                }
                case '/commands/post': {
                    const { userKey, postKey, content } = await parseBody(req);
                    await kActorBus.send((ref: any) => ref(Post, postKey).post(userKey, content));
                    sendOk(res);
                    break;
                }
                case '/commands/like': {
                    const { userKey, postKey } = await parseBody(req);
                    await kActorBus.send((ref: any) => ref(Like, `${userKey}|${postKey}`).like());
                    sendOk(res);
                    break;
                }
                case '/commands/view': {
                    const { userKey, postKey } = await parseBody(req);
                    await kActorBus.send((ref: any) => ref(View, `${userKey}|${postKey}`).view());
                    sendOk(res);
                    break;
                }
                case '/commands/comment': {
                    const { userKey, postKey, content } = await parseBody(req);
                    await kActorBus.send((ref: any) => ref(Comment, ulid()).comment(content, postKey, userKey));
                    sendOk(res);
                    break;
                }
                case '/commands/follow': {
                    const { userKey, followedKey } = await parseBody(req);
                    await kActorBus.send((ref: any) => ref(Follower, `${userKey}|${followedKey}`).follow());
                    sendOk(res);
                    break;
                }
                case '/commands/unfollow': {
                    const { userKey, followedKey } = await parseBody(req);
                    await kActorBus.send((ref: any) => ref(Follower, `${userKey}|${followedKey}`).unfollow());
                    sendOk(res);
                    break;
                }
                case '/queries/personal-feed': {
                    const { userKey, startSortKey, limit } = await parseBody(req);
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
                        key: sortKey,
                    })));
                    sendJson(res, { status: 'ok', data: posts });
                    break;
                }
                case '/queries/global-feed': {
                    const { startSortKey, limit } = await parseBody(req);
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
                        key: sortKey,
                    })));
                    sendJson(res, { status: 'ok', data: posts });
                    break;
                }
                case '/queries/comments': {
                    const { startSortKey, limit, postKey } = await parseBody(req);
                    const comments = await store.query({
                        store: COMMENTS_STORE,
                        type: 'many',
                        limit,
                        startSortKey,
                        key: postKey,
                    });
                    sendJson(res, { status: 'ok', data: comments });
                    break;
                }
                case '/queries/active-users': {
                    const { limit, postKey, textSearch } = await parseBody(req);
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
                    sendJson(res, { status: 'ok', data: activeUsers });
                    break;
                }
                case '/queries/user-timeline': {
                    const { startSortKey, limit, userKey } = await parseBody(req);
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
                        key: sortKey,
                    })));
                    sendJson(res, { status: 'ok', data: posts });
                    break;
                }
                default:
                    res.writeHead(404);
                    res.end('Not found');
            }
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });
    server.listen(port, () => {
        console.log(`Node.js server listening on port ${port}`);
    });
    return server;
}
