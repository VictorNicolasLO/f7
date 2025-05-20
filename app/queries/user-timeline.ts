// import { query } from "../../infrastructure";
// import { POST_STORE } from "../views/post";
// import { USER_TIMELINE } from "../views/user-timeline";

// export type UserTimelineQueryArgs = {
//     page: number;
//     limit: number;
//     userKey: string;
// }

// export const userTimelineQuery = query<UserTimelineQueryArgs>((queryArgs)=>({
//     store: USER_TIMELINE,
//     type: 'many',
//     limit: queryArgs.limit,
//     page: queryArgs.page,
//     key: queryArgs.userKey,
// })).thenQuery((queryArgs, result) => result.map(( {sortKey: postKey})=> ({
//     store: POST_STORE,
//     type: 'one',
//     key: postKey,
// }))).done()