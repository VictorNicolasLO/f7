import { connect } from "node:http2";
import { createDeferredPromise } from "./utils";


export const createHttp2Client = (url: string) => {
    const client = connect(url)
    client.on("error", (err) => {
        console.error("Client error:", err);
    });
    client.on("connect", async () => {
        console.log("Connected to server");
    })

    const request = async (path: string, payload: any) => {
        const { promise, resolve } = createDeferredPromise();
        const jsonPayload = JSON.stringify(payload);
        const req = client.request({
            ":path": path,
            ":method": "POST",
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(jsonPayload),
        });
        req.write(jsonPayload);

        req.setEncoding('utf8');
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => {
            resolve(JSON.parse(data));
        });
        req.end();
        return await promise
    }
    return {
        request,
        _client: client,
    }
}