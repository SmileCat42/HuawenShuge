import express from "express"
import multer from "multer"
import pool from "./db.js"

const app = express()

const upload = multer({
    storage: multer.memoryStorage()
})

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        res.sendStatus(204)
        return
    }

    next()
})

app.use(express.json());

app.post("/book/", upload.single("image"), async (req,res) => {
    console.log("POST >> recieved", req.body)
    console.log(req.file)
    const result = await pool.query(`insert into products(name, price, author, detail, image) values(
        $1, $2, $3, $4, $5) RETURNING *`,
        [req.body.name, Number(req.body.price), req.body.author, req.body.detail, req.file?.buffer])
    await pool.query("select *from products")
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(result.rows[0]))
})

app.post("/account/:id_acc/profile-image",
    upload.single("image"),
    async (req, res) => {

        const id_acc = Number(req.params.id_acc)

        if (Number.isNaN(id_acc)) {
            res.status(400).send("Invalid account id")
            return
        }

        if (!req.file) {
            res.status(400).send("No image uploaded")
            return
        }

        const result = await pool.query(
            `UPDATE account
             SET image = $1
             WHERE id_acc = $2`,
            [req.file.buffer, id_acc]
        )

        if (result.rowCount === 0) {
            res.status(404).send("Account not found")
            return
        }

        res.send("Profile image uploaded successfully")
    }
)

app.get("/account/:id_acc/profile-image", async (req, res) => {

    const id_acc = Number(req.params.id_acc)

    if (Number.isNaN(id_acc)) {
        res.status(400).send("Invalid account id")
        return
    }

    const result = await pool.query(
        `SELECT image
         FROM account
         WHERE id_acc = $1`,
        [id_acc]
    )

    if (result.rows.length === 0) {
        res.status(404).send("Account not found")
        return
    }

    if (!result.rows[0].image) {
        res.status(404).send("Profile image not found")
        return
    }

    res.setHeader("Content-Type", "image/jpeg")
    res.end(result.rows[0].image)
})

app.listen(3001, () => {
    console.log("Running on 3001")
})