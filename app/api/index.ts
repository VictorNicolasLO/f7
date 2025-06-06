import { ulid } from "ulid"
import type { KActorBus, QueryStore } from "../../infrastructure"
import { Comment } from "../domain/comment/comment"
import { Follower } from "../domain/follower/follower"
import { Like } from "../domain/like/like"
import { Post } from "../domain/post"
import { UserActive } from "../domain/user-active"
import { View } from "../domain/view"
import { ACTIVE_USERS_BY_KEY_STORE, ACTIVE_USERS_STORE } from "../views/active-users"
import { COMMENTS_STORE } from "../views/comments"
import { FEED_STORE } from "../views/feed"
import { FOLLOWERS_STORE } from "../views/followers"
import { POST_STORE } from "../views/post"
import { USER_TIMELINE } from "../views/user-timeline"
import { getAccessToken, getUserCredentials, validateAccessToken } from "./auth"
import { USER_POST_INTERACTION_STORE } from "../views"
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const responseInit = { headers };

function withCORS(response: Response, status: number = 200) {
    // Always set CORS headers
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    return { response, status };
}

async function handleAuth(req: Request) {
    const { username, password } = await req.json();
    const refreshToken = getUserCredentials(username, password);
    const [, accessToken] = getAccessToken(refreshToken.refreshToken);
    return withCORS(Response.json({ refreshToken, accessToken }, responseInit));
}

async function handleRefreshToken(req: Request) {
    const { refreshToken } = await req.json();
    const [error, accessToken] = getAccessToken(refreshToken);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    return withCORS(Response.json({ accessToken }, responseInit));
}

async function handleActivateUser(req: Request, kActorBus: KActorBus) {
    const { jwt } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64, publicUsername } = userData;
    const dateStr = new Date().toISOString();
    await kActorBus.send((ref) => ref(UserActive, userIdB64).setActive(dateStr, publicUsername));
    return withCORS(new Response("OK", responseInit));
}

async function handlePost(req: Request, kActorBus: KActorBus) {
    const { jwt, postKey, content } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    await kActorBus.send((ref) => ref(Post, postKey).post(userIdB64, content));
    return withCORS(new Response("OK", responseInit));
}

async function handleLike(req: Request, kActorBus: KActorBus) {
    
    const { jwt, postKey } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    console.time('Handle Like');
    await kActorBus.send((ref) => ref(Like, `${userIdB64}|${postKey}`).like());
    console.timeEnd('Handle Like');
    return withCORS(new Response("OK", responseInit));
}

async function handleView(req: Request, kActorBus: KActorBus) {
    const { jwt, postKey } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    await kActorBus.send((ref) => ref(View, `${userIdB64}|${postKey}`).view());
    return withCORS(new Response("OK", responseInit));
}

async function handleComment(req: Request, kActorBus: KActorBus) {
    const { jwt, postKey, content } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    await kActorBus.send((ref) => ref(Comment, ulid()).comment(content, postKey, userIdB64));
    return withCORS(new Response("OK", responseInit));
}

async function handleFollow(req: Request, kActorBus: KActorBus) {
    const { jwt, followedKey } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    await kActorBus.send((ref) => ref(Follower, `${userIdB64}|${followedKey}`).follow());
    return withCORS(new Response("OK", responseInit));
}

async function handleUnfollow(req: Request, kActorBus: KActorBus) {
    const { jwt, followedKey } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    await kActorBus.send((ref) => ref(Follower, `${userIdB64}|${followedKey}`).unfollow());
    return withCORS(new Response("OK", responseInit));
}

async function handlePersonalFeed(req: Request, store: QueryStore) {
    const { userKey, startSortKey, limit } = await req.json();
    const postKeys = await store.query({
        store: FEED_STORE,
        type: 'many',
        limit,
        startSortKey,
        key: userKey,
        reversed: true,
    });
    const posts = await Promise.all(postKeys.map(({ sortKey }) => store.query({
        store: POST_STORE,
        type: 'one',
        key: sortKey!,
    })));
    return withCORS(Response.json({ status: 'ok', data: posts }, responseInit));
}

async function handleGlobalFeed(req: Request, store: QueryStore) {
    const { startSortKey, limit, reverse, jwt } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    console.time('Global Feed Query');
    const postKeys = await store.query({
        store: FEED_STORE,
        type: 'many',
        limit,
        startSortKey,
        key: 'global',
        reversed: reverse !== undefined ? reverse : true,
    });
    const interationsPromise = Promise.all(postKeys.map(({ sortKey }) => store.query({
        store: USER_POST_INTERACTION_STORE,
        type: 'one',
        key: `${userIdB64}|${sortKey}`,
    })));
    const posts = await Promise.all(postKeys.map(({ sortKey }) => store.query({
        store: POST_STORE,
        type: 'one',
        key: sortKey!,
    })));
    const postsByUserId = Object.groupBy(posts, post => post[0]?.data.userKey);
    const users = await Promise.all(Object.keys(postsByUserId).map(async userKey => {
        const userData = await store.query({
            store: ACTIVE_USERS_BY_KEY_STORE,
            type: 'one',
            key: userKey,
        });
        return {
            userKey,
            username: userData[0] ? userData[0].data.username : 'Unknown User',
        };
    }));
    const postsWithUsernames = posts.map((post, index) => {
        const userKey = post[0]?.data.userKey;
        const user = users.find(u => u.userKey === userKey);
        return {
            ...post[0],
            data: {
                ...post[0].data,
                username: user ? user.username : 'Unknown User',
            }
        };
    });
    const interactions = await interationsPromise;
    const postWithuserNamesAndResults = interactions.map((interaction, index) => {
        if (interaction[0]) {
            postsWithUsernames[index].data.hasLike = interaction[0].data.like || false;
            postsWithUsernames[index].data.hasView = interaction[0].data.view || false;
        } else {
            postsWithUsernames[index].data.hasLike = false;
            postsWithUsernames[index].data.hasView = false;
        }
        return postsWithUsernames[index];
    });

    console.timeEnd('Global Feed Query');
    return withCORS(Response.json({ status: 'ok', data: postWithuserNamesAndResults }, responseInit));
}

async function handleComments(req: Request, store: QueryStore) {
    const { startSortKey, limit, postKey } = await req.json();
    const comments = await store.query({
        store: COMMENTS_STORE,
        type: 'many',
        limit,
        startSortKey,
        key: postKey,
    });
    return withCORS(Response.json({ status: 'ok', data: comments }, responseInit));
}

async function handleActiveUsers(req: Request, store: QueryStore) {
    const { limit, postKey, textSearch } = await req.json();
    const users = await store.query({
        store: ACTIVE_USERS_STORE,
        type: 'many',
        limit,
        key: postKey,
        startSortKey: textSearch,
    });
    const activeUsers = await Promise.all(users.map(async ({ data, sortKey }) => {
        const followData = await store.query({
            store: FOLLOWERS_STORE,
            type: 'one',
            key: data.userKey,
        });
        const isFollowing = followData[0] ? followData[0].data.active : false;
        return {
            userKey: data.userKey,
            username: sortKey,
            isFollowing,
        };
    }));
    return withCORS(Response.json({ status: 'ok', data: activeUsers }, responseInit));
}

async function handleUserTimeline(req: Request, store: QueryStore) {
    const { startSortKey, limit, userKey, reverse } = await req.json();
    console.log(reverse)
    const postKeysPromise = store.query({
        store: USER_TIMELINE,
        type: 'many',
        limit,
        startSortKey,
        key: userKey,
        reversed: reverse !== undefined ? reverse : true,
    });
    const usernamePromise = store.query({
        store: ACTIVE_USERS_BY_KEY_STORE,
        type: 'one',
        key: userKey,
    });
    const [postKeys, usernameData] = await Promise.all([postKeysPromise, usernamePromise]);

    const posts = await Promise.all(postKeys.map(({ sortKey }) => store.query({
        store: POST_STORE,
        type: 'one',
        key: sortKey!,
    })));
    return withCORS(Response.json({ status: 'ok', data: posts, username: usernameData[0] ? usernameData[0].data.username : undefined }, responseInit));
}

export const startServer = (store: QueryStore, kActorBus: KActorBus, port: number) =>
    Bun.serve({
        port,
        fetch: async (req: Request) => {
            const url = new URL(req.url);
            const pathname = url.pathname;
            if (req.method === 'OPTIONS') {
                return new Response(null, { status: 204, headers });
            }
            if (pathname === '/api/status') {
                return withCORS(new Response('OK', responseInit)).response;
            }
            if (pathname === '/auth' && req.method === 'POST') {
                return (await handleAuth(req)).response;
            }
            if (pathname === '/refresh-token' && req.method === 'POST') {
                return (await handleRefreshToken(req)).response;
            }
            if (pathname === '/commands/activate-user' && req.method === 'POST') {
                return (await handleActivateUser(req, kActorBus)).response;
            }
            if (pathname === '/commands/post' && req.method === 'POST') {
                return (await handlePost(req, kActorBus)).response;
            }
            if (pathname === '/commands/like' && req.method === 'POST') {
                return (await handleLike(req, kActorBus)).response;
            }
            if (pathname === '/commands/view' && req.method === 'POST') {
                return (await handleView(req, kActorBus)).response;
            }
            if (pathname === '/commands/comment' && req.method === 'POST') {
                return (await handleComment(req, kActorBus)).response;
            }
            if (pathname === '/commands/follow' && req.method === 'POST') {
                return (await handleFollow(req, kActorBus)).response;
            }
            if (pathname === '/commands/unfollow' && req.method === 'POST') {
                return (await handleUnfollow(req, kActorBus)).response;
            }
            if (pathname === '/queries/personal-feed' && req.method === 'POST') {
                return (await handlePersonalFeed(req, store)).response;
            }
            if (pathname === '/queries/global-feed' && req.method === 'POST') {
                return (await handleGlobalFeed(req, store)).response;
            }
            if (pathname === '/queries/comments' && req.method === 'POST') {
                return (await handleComments(req, store)).response;
            }
            if (pathname === '/queries/active-users' && req.method === 'POST') {
                return (await handleActiveUsers(req, store)).response;
            }
            if (pathname === '/queries/user-timeline' && req.method === 'POST') {
                return (await handleUserTimeline(req, store)).response;
            }
            return new Response('Not found', { status: 404, headers });
        },
    })