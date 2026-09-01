import express from "express";
import multer from "multer";
import pool from "./db.js";
const app = express();
const upload = multer({
    storage: multer.memoryStorage()
});
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }
    next();
});
app.use(express.json());
app.post("/book/", upload.single("image"), async (req, res) => {
    console.log("POST >> recieved", req.body);
    console.log(req.file);
    const result = await pool.query(`insert into products(name, price, author, detail, image) values(
        $1, $2, $3, $4, $5) RETURNING *`, [req.body.name, Number(req.body.price), req.body.author, req.body.detail, req.file?.buffer]);
    await pool.query("select *from products");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result.rows[0]));
    res.send("OK");
});
app.listen(3001, () => {
    console.log("Running on 3001");
});
//# sourceMappingURL=post.js.map