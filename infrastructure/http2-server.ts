import { createServer } from "node:http2";

export const startHttp2Server = async (port: number, on: (path:string, data:any)=> Promise<any>) => {
    const server = createServer();

    server.on("stream", (stream, headers) => {
        // This is where you would handle the incoming stream
        //console.log("Received stream with headers:", headers);
        const method = headers[':method'];   // e.g., 'POST'
        const path = headers[':path'];       // e.g., '/submit'
        // You can send a response back to the client

        let body = '';
        stream.on('data', chunk => {
            body += chunk;
        });

        stream.on('end', async () => {
            console.log('Request method:', method);
            console.log('Request path:', path);
            console.log('Request body:', body);

            const response = await on(path || '', JSON.parse(body));
            
            stream.respond({ ':status': 200,  "content-type": 'application/json', });
            
            stream.end(JSON.stringify(response));
        });

    })

    server.on("error", (err) => {
        console.error("Server error:", err);
    });
    server.listen(port, () => {
        console.log("HTTP/2 server is running on port " + port);
    });
}