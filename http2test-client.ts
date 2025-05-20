import { connect } from "node:http2";

const start = () => {
    const client = connect("http://localhost:3000")
    client.on("error", (err) => {
        console.error("Client error:", err);
    });

    client.on("connect", async () => {
        console.log("Connected to server");
       // sleep 1 second

        for (let i = 0; i < 1; i++) {

            console.time(`http2test-client-${i}`);
            const req = client.request({
                ":path": "/",
                ":method": "GET",
            });

            req.on('response', (headers, flags) => {

                // for (const name in headers) {
                //     console.log(`${name}: ${headers[name]}`);
                // }

            });

            req.setEncoding('utf8');
            let data = '';
            req.on('data', (chunk) => { data += chunk; });
            req.on('end', () => {
                //console.log(`\n${data}`);
                console.timeEnd(`http2test-client-${i}`);

                // 
            });
            req.end();

        }

        //client.close();

    });
}

start()


