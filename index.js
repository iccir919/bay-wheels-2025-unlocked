import http from "node:http";

const PORT = 8000;

const server = http.createServer((req, res) => {
    if (req.url === "/api" && req.method === "GET") {
        res.end("Request received and response sent.")
    }
});

server.listen(PORT, console.log(`Server listening on port ${PORT}`));