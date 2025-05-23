// test-api.js
// Node.js script to test all Flash7 API endpoints
// Run with: node test-api.js

const BASE_URLS =[ 'http://localhost:8085', 'http://localhost:8082','http://localhost:8083'];
let lastBaseUrl = 0;
const getBaseUrl = ()=>{
    return BASE_URLS[0];
    if (lastBaseUrl === 0) {
        lastBaseUrl = 1;
        return BASE_URLS[1];
    } else {
        lastBaseUrl = 0;
        return BASE_URLS[0];
    }
};
const useHttp2 = true;
let http2Client;
if (useHttp2) {
    const http2 = require('http2');
    // Use the first BASE_URL for http2.connect, but strip protocol for http2.connect
    const url = new URL(getBaseUrl());
    http2Client = http2.connect('http://localhost:8085');
    http2Client.on('error', (err) => {
        console.error('HTTP2 connection error:', err);
    }
    );
}
async function main() {
    // Helper for POST requests
    async function post(path, body) {
        if (!useHttp2) {
            const tries = 10;
            const run = async () => {
                const res = await fetch(`${getBaseUrl()}${path}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                let data = await res.text();
                console.log(`POST ${path} →`, res.status, data);
                return data;
            }
            try {
                return await run();
            } catch (err) {
                
                if (tries > 0) {
                    console.log(`Retrying POST ${path} (${tries} tries left)`);
                    return await post(path, body);
                } else {
                    console.error(`Error in POST ${path}:`, err);
                    throw err;
                }
            }
        } else {
            // HTTP2 version
            return new Promise((resolve, reject) => {
                const req = http2Client.request({
                    ':method': 'POST',
                    ':path': path,
                    'content-type': 'application/json'
                });
                
                req.write(JSON.stringify(body));
                req.on('response', (headers, flags) => {
                    // Optionally handle headers

                });
                req.setEncoding('utf8');
                let data = '';
                req.on('data', chunk => {

                     data += chunk; 
                });
                req.on('end', () => {
                   // console.log(`POST ${path} (HTTP2) →`, data);
                    resolve(data);
                });
                req.on('error', reject);
                req.end();
            });
        }
    }

    // Helper for GET requests
    async function get(path) {
        if (!useHttp2) {
            const res = await fetch(`${BASE_URL}${path}`);
            let data = await res.json();
            console.log(`GET ${path} →`, res.status, data);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                const req = http2Client.request({
                    ':method': 'GET',
                    ':path': path
                });
                let data = '';
                req.setEncoding('utf8');
                req.on('data', chunk => { data += chunk; });
                req.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        console.log(`GET ${path} (HTTP2) →`, json);
                        resolve(json);
                    } catch (e) {
                        reject(e);
                    }
                });
                req.on('error', reject);
                req.end();
            });
        }
    }

    //   // GET /api/status
    //   await get('/api/status');

    //   // POST /commands/activate-user
    //   await post('/commands/activate-user', { userKey: 'user1', username: 'testuser' });

    // POST /commands/post
    let cont = 0
    console.time(`POST /commands/post`);
    await Promise.all(new Array(10000).fill(0).map(async (_, i) => {
        // console.time(`POST /commands/post ${i}`);
        await post('/commands/post', { userKey: 'user' + i, postKey: 'post' + i, content: 'Hello world! how are you doing, great? wow bla bla bla' });
        // console.timeEnd(`POST /commands/post`);
    }))
    console.timeEnd(`POST /commands/post`);



    //   // POST /commands/like
    //   await post('/commands/like', { userKey: 'user1', postKey: 'post1' });

    //   // POST /commands/view
    //   await post('/commands/view', { userKey: 'user1', postKey: 'post1' });

    //   // POST /commands/comment
    //   await post('/commands/comment', { userKey: 'user1', postKey: 'post1', content: 'Nice post!' });

    //   // POST /commands/follow
    //   await post('/commands/follow', { userKey: 'user1', followedKey: 'user2' });

    //   // POST /commands/unfollow
    //   await post('/commands/unfollow', { userKey: 'user1', followedKey: 'user2' });

    //   // POST /queries/personal-feed
    //   await post('/queries/personal-feed', { userKey: 'user1', startSortKey: null, limit: 10 });

    //   // POST /queries/global-feed
    //   await post('/queries/global-feed', { startSortKey: null, limit: 10 });

    //   // POST /queries/comments
    //   await post('/queries/comments', { postKey: 'post1', startSortKey: null, limit: 10 });

    //   // POST /queries/active-users
    //   await post('/queries/active-users', { limit: 10, postKey: 'post1', textSearch: null });

    //   // POST /queries/user-timeline
    //   await post('/queries/user-timeline', { userKey: 'user1', startSortKey: null, limit: 10 });

    // Promise.all(new Array(10000).fill(0).map(async (_, i) => {
    //     console.time(`POST /commands/post ${i}`);
    //     await post('/queries/user-timeline', { userKey: 'user1', startSortKey: null, limit: 10 });
    //     console.timeEnd(`POST /commands/post ${i}`);
    // }))
}

await main()
if (useHttp2 && http2Client) http2Client.close();

// If you don't have node-fetch installed, run:
//   npm install node-fetch@2
