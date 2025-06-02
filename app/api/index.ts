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
import { getAccessToken, getUserCredentials, validateAccessToken } from "./auth"

export const startServer = (store: QueryStore, kActorBus: KActorBus, port: number) =>
    Bun.serve({
        port: port,

        routes: {
            "/api/status": new Response("OK"),
            '/auth': async req => {
                const { username, password } = await req.json()
                const refreshToken = getUserCredentials(username, password)
                const [,accessToken] = getAccessToken(refreshToken.refreshToken)
                return Response.json({
                    refreshToken,
                    accessToken
                })
            },
            '/refresh-token': async req => {
                const { refreshToken } = await req.json()
                const [error, accessToken] = getAccessToken(refreshToken)
                if (error) {
                    return Response.json({ error }, { status: 401 })
                }
                return Response.json({
                    accessToken
                })
            },
            '/commands/activate-user': async req => {
                const { jwt } = await req.json()
                const [error, userData] = validateAccessToken(jwt)
                if (error) {
                    return Response.json({ error }, { status: 401 })
                }
                const { userIdB64, publicUsername } = userData
                const dateStr = new Date().toISOString()
                await kActorBus.send((ref) => ref(UserActive, userIdB64).setActive(dateStr, publicUsername))
                return new Response("OK")
            },
            '/commands/post': async req => {
                const { jwt, postKey, content } = await req.json()
                const [error, userData] = validateAccessToken(jwt)
                if (error) {
                    return Response.json({ error }, { status: 401 })
                }
                const { userIdB64 } = userData

                await kActorBus.send((ref) => ref(Post, postKey).post(userIdB64, content))
                return new Response("OK")
            },
            '/commands/like': async req => {
                const { jwt, postKey } = await req.json()
                const [error, userData] = validateAccessToken(jwt)
                if (error) {
                    return Response.json({ error }, { status: 401 })
                }
                const { userIdB64 } = userData

                await kActorBus.send((ref) => ref(Like, `${userIdB64}|${postKey}`).like())
                return new Response("OK")
            },
            '/commands/view': async req => {
                const { jwt, postKey } = await req.json()
                const [error, userData] = validateAccessToken(jwt)
                if (error) {
                    return Response.json({ error }, { status: 401 })
                }
                const { userIdB64 } = userData
                await kActorBus.send((ref) => ref(View, `${userIdB64}|${postKey}`).view())
                return new Response("OK")
            },
            '/commands/comment': async req => {
                const { jwt, postKey, content } = await req.json()
                const [error, userData] = validateAccessToken(jwt)
                if (error) {
                    return Response.json({ error }, { status: 401 })
                }
                const { userIdB64 } = userData
                await kActorBus.send((ref) => ref(Comment, ulid()).comment(content, postKey, userIdB64))
                return new Response("OK")
            },
            '/commands/follow': async req => {
                const { jwt, followedKey } = await req.json()
                const [error, userData] = validateAccessToken(jwt)
                if (error) {
                    return Response.json({ error }, { status: 401 })
                }
                const { userIdB64 } = userData

                await kActorBus.send((ref) => ref(Follower, `${userIdB64}|${followedKey}`).follow())
                return new Response("OK")
            },
            '/commands/unfollow': async req => {
                const { jwt, followedKey } = await req.json()
                const [error, userData] = validateAccessToken(jwt)
                if (error) {
                    return Response.json({ error }, { status: 401 })
                }
                const { userIdB64 } = userData
                await kActorBus.send((ref) => ref(Follower, `${userIdB64}|${followedKey}`).unfollow())
                return new Response("OK")
            },

            '/queries/personal-feed': async req => {
                const { userKey, startSortKey, limit } = await req.json()
                const postKeys = await store.query({
                    store: FEED_STORE,
                    type: 'many',
                    limit,
                    startSortKey,
                    key: userKey,
                })
                const posts = await Promise.all(postKeys.map(({ sortKey }) => store.query({
                    store: POST_STORE,
                    type: 'one',
                    key: sortKey!,
                })))
                return Response.json({
                    status: 'ok',
                    data: posts
                })
            },
            '/queries/global-feed': async req => {
                const { startSortKey, limit } = await req.json()
                const postKeys = await store.query({
                    store: FEED_STORE,
                    type: 'many',
                    limit,
                    startSortKey,
                    key: 'global',
                })
                const posts = await Promise.all(postKeys.map(({ sortKey }) => store.query({
                    store: POST_STORE,
                    type: 'one',
                    key: sortKey!,
                })))
                return Response.json({
                    status: 'ok',
                    data: posts
                })
            },
            '/queries/comments': async req => {
                const { startSortKey, limit, postKey } = await req.json()
                const comments = await store.query({
                    store: COMMENTS_STORE,
                    type: 'many',
                    limit,
                    startSortKey,
                    key: postKey,
                })
                return Response.json({
                    status: 'ok',
                    data: comments
                })
            },
            '/queries/active-users': async req => {
                const { limit, postKey, textSearch } = await req.json()
                const users = await store.query({
                    store: ACTIVE_USERS_STORE,
                    type: 'many',
                    limit,
                    key: postKey,
                    startSortKey: textSearch
                })
                const activeUsers = await Promise.all(users.map(async ({ data, sortKey }) => {
                    const followData = await store.query({
                        store: FOLLOWERS_STORE,
                        type: 'one',
                        key: data.userKey,
                    })
                    const isFollowing = followData[0] ? followData[0].data.active : false
                    return {
                        userKey: data.userKey,
                        username: sortKey,
                        isFollowing
                    }
                }))
                return Response.json({
                    status: 'ok',
                    data: activeUsers
                })
            },
            '/queries/user-timeline': async req => {
                const { startSortKey, limit, userKey } = await req.json()
                const postKeys = await store.query({
                    store: USER_TIMELINE,
                    type: 'many',
                    limit,
                    startSortKey,
                    key: userKey,
                })
                const posts = await Promise.all(postKeys.map(({ sortKey }) => store.query({
                    store: POST_STORE,
                    type: 'one',
                    key: sortKey!,
                })))
                return Response.json({
                    status: 'ok',
                    data: posts
                })
            },
        }
    })