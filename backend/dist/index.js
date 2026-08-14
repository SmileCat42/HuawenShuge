import { createServer } from "http";
const server = createServer((req, res) => {
    console.log(req.method);
});
server.listen(3000);
//# sourceMappingURL=index.js.map