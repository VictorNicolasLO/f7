import { connect } from "node:http2";
import { createDeferredPromise } from "./utils";

type Http2Settings = {
    onConnect?: () => void;
    onError?: (err: any) => void;
    reconnectionTimeout?: number;
}
const DEFAULT_CONNECTION_TIMEOUT = 5000;
export const createHttp2Client = (url: string, settings: Http2Settings = {}) => {
    let client = connect(url)
    let reconnecting = false
    const onConnect = async () => {
        console.log("Connected to server");
        if (settings.onConnect) {
            settings.onConnect();
        }
    }

    const onError = (err: any) => {
        if (reconnecting) {
            console.warn("Already reconnecting, ignoring error:", err);
            return; // Already reconnecting, ignore this error
        }
        reconnecting = true; // Set reconnecting flag to prevent multiple reconnection attempts
        console.error("Client error:", err);
        setTimeout(() => {
            console.log("Reconnecting to server...");
            client = connect(url);
            client.on("error", onError);
            client.on("connect", onConnect);
            reconnecting = false; // Reset reconnecting flag after reconnect attempt
        }, settings.reconnectionTimeout || DEFAULT_CONNECTION_TIMEOUT)
        if (settings.onError) {
            settings.onError(err);
        }
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