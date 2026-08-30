import { createServer } from "http";
import pool from "./db.js";
const book = [
    { id: 1, name: "AAA", price: 200 },
    { id: 2, name: "BBB", price: 300 },
    { id: 3, name: "CCC", price: 400 }
];
const server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
    }
    const parts = (req.url ?? "/").split("/"); //?? เช็คว่าว่างไหม เพราะถ้าไม่ทำ ts มันจะฟ้อง
    if (req.method === "GET" && parts[1] === "book") {
        if (parts[2]) {
            console.log("GET >> ", parts[1], " ID: ", parts[2]);
            const id = Number(parts[2]);
            if (Number.isNaN(id)) { //ควรตรวจสอบกรณีที่ไม่ได้ส่งมาเป็นเลข เช่น book/abc
                res.statusCode = 400;
                res.end("Invalid Book id :(");
                return;
            }
            const show = await pool.query("select *from products where id = $1", [id]);
            if (show.rows.length === 0) {
                res.statusCode = 404;
                res.end("Not found");
                return;
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(show.rows));
            return;
        }
        else {
            const show3 = await pool.query("select *from products");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(show3.rows));
            return;
        }
    }
    if (req.method === "POST" && parts[1] === "book") {
        console.log("POST >> recieved");
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });
        req.on("end", async () => {
            let obj;
            console.log("Body: ", body);
            try {
                obj = JSON.parse(body);
            }
            catch (error) {
                res.end("Invalid JSON");
                return;
            }
            if (!obj.name || !obj.price) {
                res.end("Invalid data");
                return;
            }
            if (typeof obj.name !== "string" || typeof obj.price !== "number") {
                res.end("Wrong type data");
                return;
            }
            if (obj.name === "" || obj.price <= 0) {
                res.end("Please fill data or price more than 0");
                return;
            }
            try {
                const show1 = await pool.query(`insert into products(name, price, author, detail)
                    values($1, $2, $3, $4) RETURNING*`, [obj.name, obj.price, obj.author, obj.detail]);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(show1.rows[0]));
            }
            catch (error) {
                console.error("DB Insert Error:", error);
                res.statusCode = 500;
                res.end("Database error");
            }
        });
        return;
    }
    if (req.method === "PUT" && parts[1] === "book") {
        if (!parts[2]) {
            res.end("Pls take more detail");
            return;
        }
        const id = Number(parts[2]);
        if (Number.isNaN(id)) {
            res.end("Error type");
            return;
        }
        console.log("PUT >> recieved ID = ", id);
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });
        req.on("end", async () => {
            console.log("Body = ", body);
            let obj;
            try {
                obj = JSON.parse(body);
            }
            catch {
                res.end("Invalid data");
                return;
            }
            if (!obj.name || !obj.price) {
                res.end("Pls fill detail");
                return;
            }
            if (typeof obj.name !== "string" || typeof obj.price !== "number") {
                res.end("Wrong type detail");
                return;
            }
            if (obj.price <= 0) {
                res.end("Pls take price more than 0");
                return;
            }
            const show = await pool.query(`update products
                set name = $1,
                    price = $2,
                    author = $3,
                    detail = $4
                where id = $5
                RETURNING*`, [obj.name, obj.price, obj.author, obj.detail, id]);
            if (show.rowCount === 0) {
                res.statusCode = 404;
                res.end("No data");
                return;
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(show.rows[0]));
            return;
        });
        return;
    }
    if (req.method === "DELETE" && parts[1] === "book") {
        if (!parts[2]) {
            res.end("No order");
            return;
        }
        const id = Number(parts[2]);
        if (Number.isNaN(id)) {
            res.statusCode = 400;
            res.end("Invalid path");
            return;
        }
        /*const index = book.findIndex((book) => id === book.id)
        if (index === -1) {
            res.statusCode = 404
            res.end("Invalid index")
            return
        }*/
        const show2 = await pool.query(`delete from products where id = $1`, [id]);
        if (show2.rowCount === 0) {
            res.end("Delete fail");
            return;
        }
        console.log("Delete complete ID >> ", id);
        res.end(JSON.stringify({
            message: "Delete success!",
            id: id
        }));
        return;
    }
    res.end("++ HOME PAGE ++");
});
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
//# sourceMappingURL=index.js.map