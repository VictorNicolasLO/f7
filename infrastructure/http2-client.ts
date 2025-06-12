import { connect } from "node:http2";
import { createDeferredPromise } from "./utils";


export const createHttp2Client = (url: string) => {
    let client = connect(url)


    const onConnect = async () => {
        console.log("Connected to server");
    }

    const onError = (err: any) => {
        console.error("Client error:", err);
        setTimeout(() => {
            console.log("Reconnecting to server...");
            client = connect(url);
            client.on("error", onError);
            client.on("connect", onConnect);
        }, 2000)
    }
    client.on("error", onError);
    client.on("connect", onConnect)


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