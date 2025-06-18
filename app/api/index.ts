import { ulid,  isValid as iValidUlid} from "ulid"
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
import { postsWithUsersAndInteractions } from "./queries/posts-timeline"
import { commentsWithUsers } from "./queries/comments"
import { headers, responseInit, withCORS } from "./utils/with-cors"
import { validateProperties } from "./validations"
import { validateContent, validatePassword, validateUlidKey, validateUserKey, validateUsername } from "./validations/properties"

async function handleAuth(req: Request) {
    const { username, password } = await req.json();
    const validationError = validateProperties([username, password], [validateUsername, validatePassword])
    if (validationError) {
        return validationError;
    }
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
    const { jwt, content } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const validationError = validateProperties([content], [validateContent])
    if (validationError) {
        return validationError;
    }
    const { userIdB64 } = userData;
    await kActorBus.send((ref) => ref(Post, ulid()).post(userIdB64, content));
    return withCORS(new Response("OK", responseInit));
}

async function handleLike(req: Request, kActorBus: KActorBus) {

    const { jwt, postKey } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const validationError = validateProperties([postKey], [validateUlidKey])
    if (validationError) {
        return validationError;
    }
    const { userIdB64 } = userData;
    // validate postkey is ulid
    if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(postKey)) {
        return withCORS(Response.json({ error: "Invalid post key format" }, { status: 400, headers }), 400);
    }
 
    console.time('Handle Like');
    await kActorBus.send((ref) => ref(Like, `${userIdB64}|${postKey}`).like());
    console.timeEnd('Handle Like');
    return withCORS(new Response("OK", responseInit));
}

async function handleView(req: Request, kActorBus: KActorBus) {
    const { jwt, postKey } = await req.json();
    const validationError = validateProperties([postKey], [validateUlidKey])
    if (validationError) {
        return validationError;
    }
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
    const validationError = validateProperties([postKey, content], [validateUlidKey, validateContent])
    if (validationError) {
        return validationError;
    }
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    if (!content || content.length === 0) {
        return withCORS(Response.json({ error: "Content cannot be empty" }, { status: 400, headers }), 400);
    }
    if (content.length > 280) {
        return withCORS(Response.json({ error: "Content exceeds maximum length of 280 characters" }, { status: 400, headers }), 400);
    }
    if (!iValidUlid(postKey)) {
        return withCORS(Response.json({ error: "Invalid post key format" }, { status: 400, headers }), 400);
    }
    const { userIdB64 } = userData;
    await kActorBus.send((ref) => ref(Comment, ulid()).comment(content, postKey, userIdB64));
    return withCORS(new Response("OK", responseInit));
}

async function handleFollow(req: Request, kActorBus: KActorBus) {
    const { jwt, followedKey } = await req.json();
    const validationError = validateProperties([followedKey], [validateUserKey])
    if (validationError) {
        return validationError;
    }
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
    const validationError = validateProperties([followedKey], [validateUserKey])
    if (validationError) {
        return validationError;
    }
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    await kActorBus.send((ref) => ref(Follower, `${userIdB64}|${followedKey}`).unfollow());
    return withCORS(new Response("OK", responseInit));
}

async function handlePersonalFeed(req: Request, store: QueryStore) {
    const { startSortKey, limit, jwt, reverse } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    const postKeys = await store.query({
        store: FEED_STORE,
        type: 'many',
        limit,
        startSortKey,
        key: userIdB64,
        reversed: reverse !== undefined ? reverse : true,
    });
    const postsWithAdditionalData = await postsWithUsersAndInteractions(postKeys, store, userIdB64);
    return withCORS(Response.json({ status: 'ok', data: postsWithAdditionalData }, responseInit));
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

    const postsWithAdditionalData = await postsWithUsersAndInteractions(postKeys, store, userIdB64);
    console.timeEnd('Global Feed Query');
    return withCORS(Response.json({ status: 'ok', data: postsWithAdditionalData }, responseInit));
}

async function handleComments(req: Request, store: QueryStore) {
    const { startSortKey, limit, postKey, reverse } = await req.json();
    const comments = await store.query({
        store: COMMENTS_STORE,
        type: 'many',
        limit,
        startSortKey,
        key: postKey,
        reversed: reverse !== undefined ? reverse : true,
    });
    const commentsWithUsersResponse = await commentsWithUsers(comments, store);
    return withCORS(Response.json({ status: 'ok', data: commentsWithUsersResponse }, responseInit));
}

async function handleActiveUsers(req: Request, store: QueryStore) {
    const { limit, textSearch, jwt } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = userData;
    const users = await store.query({
        store: ACTIVE_USERS_STORE,
        type: 'many',
        limit,
        key: textSearch.charAt(0) || '',
        startSortKey: textSearch,

    });
    const activeUsers = await Promise.all(users.map(async ({ data, sortKey }) => {
        const followData = await store.query({
            store: FOLLOWERS_STORE,
            type: 'one',
            key: userIdB64 ,
            sortKey: data.userKey,
        });

        const isFollowing = followData[0] && followData[0].data? followData[0].data.active : false;
        return {
            userKey: data.userKey,
            username: data.username,
            isFollowing,
        };
    }));
    return withCORS(Response.json({ status: 'ok', data: activeUsers }, responseInit));
}

async function handleUserByKey(req: Request, store: QueryStore) {
    const { userKey, jwt } = await req.json();
    const [error, jwtUserData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const { userIdB64 } = jwtUserData;
    const followDataPromise = store.query({
        store: FOLLOWERS_STORE,
        type: 'one',
        key: userIdB64,
        sortKey: userKey,
    });
    
    const userDataPromise = store.query({
        store: ACTIVE_USERS_BY_KEY_STORE,
        type: 'one',
        key: userKey,
    });
    const [userData, followData] = await Promise.all([userDataPromise, followDataPromise]);
    
    if (userData.length === 0) {
        return withCORS(Response.json({ status: 'error', message: 'User not found' }, { status: 404, headers }), 404);
    }
    console.log('followData', followData);
    const isFollowing = followData.length > 0 && followData[0] && followData[0].data ? followData[0].data.active : false;
    userData[0].data.isFollowing = isFollowing;
    return withCORS(Response.json({ status: 'ok', data: userData[0] }, responseInit));
}

async function handlePostByKey(req: Request, store: QueryStore) {
    const { postKey } = await req.json();
    const postdata = await store.query({
        store: POST_STORE,
        type: 'one',
        key: postKey,
    });
    if (postdata.length === 0) {
        return withCORS(Response.json({ status: 'error', message: 'Post not found' }, { status: 404, headers }), 404);
    }

    const [username, interactionData] = await Promise.all([
        await store.query({
            store: ACTIVE_USERS_BY_KEY_STORE,
            type: 'one',
            key: postdata[0]?.data.userKey,
        }),
        await store.query({
            store: USER_POST_INTERACTION_STORE,
            type: 'one',
            key: `${postdata[0]?.data.userKey}|${postKey}`,
        })]
    );

    if (interactionData.length > 0) {
        postdata[0].data.hasLike = interactionData[0].data.like || false;
        postdata[0].data.hasView = interactionData[0].data.view || false;
    } else {
        postdata[0].data.hasLike = false;
        postdata[0].data.hasView = false;
    }
    postdata[0].data.username = username[0] ? username[0].data.username : 'Unknown User';


    return withCORS(Response.json({ status: 'ok', data: postdata[0] }, responseInit));
}

async function handleUserTimeline(req: Request, store: QueryStore) {
    const { startSortKey, limit, userKey, reverse, jwt } = await req.json();
    const [error, userData] = validateAccessToken(jwt);
    if (error) {
        return withCORS(Response.json({ error }, { status: 401, headers }), 401);
    }
    const postKeys = await store.query({
        store: USER_TIMELINE,
        type: 'many',
        limit,
        startSortKey,
        key: userKey,
        reversed: reverse !== undefined ? reverse : true,
    });

    const posts = await postsWithUsersAndInteractions(postKeys, store, userData.userIdB64);
    return withCORS(Response.json({ status: 'ok', data: posts }, responseInit));
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
            if (pathname === '/queries/user-by-key' && req.method === 'POST') {
                return (await handleUserByKey(req, store)).response;
            }
            if (pathname === '/queries/post-by-key' && req.method === 'POST') {
                return (await handlePostByKey(req, store)).response;
            }
            return new Response('Not found', { status: 404, headers });
        },
    })