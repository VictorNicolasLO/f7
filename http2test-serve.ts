import { createServer } from "node:http2";

const server = createServer();

server.on("stream", (stream, headers) => {
    // This is where you would handle the incoming stream
    //console.log("Received stream with headers:", headers);
    
    // You can send a response back to the client
    stream.respond({
        ":status": 200,
        "content-type": "text/plain",
    });
    stream.end("Hello from HTTP/2 server!");
})

server.on("error", (err) => {
    console.error("Server error:", err);
});
server.listen(3000, () => {
    console.log("HTTP/2 server is running on port 3000");
});