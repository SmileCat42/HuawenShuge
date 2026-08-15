import { createServer } from "http";

const server = createServer(
    (req,res) => {
        if(req.method === "GET" && req.url === "/book/8"){
            res.end("Book ID: 8")
        }
        if(req.method === "GET" && req.url === "/book"){
            res.end("Book List")
        }
    }
)

server.listen(3000)