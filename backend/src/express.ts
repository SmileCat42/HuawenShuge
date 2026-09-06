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

//++++++++++++++++++++++++++++++ GET +++++++++++++++++++++++++++++++

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
app.get("/order/:id", async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        res.status(200).json({
            message: "Invalid path"
        })
        return
    }
    try {
        console.log("into try")
        const result = await pool.query(
            `SELECT
        o.id_order,
        o.id_cust,
        o.order_date,
        o.status,
        od.id_product,
        p.name,
        od.quantity,
        od.price,
        (od.quantity * od.price) AS subtotal
     FROM orders o
     JOIN order_detail od
        ON o.id_order = od.id_order
     JOIN products p
        ON od.id_product = p.id
     WHERE o.id_order = $1
     ORDER BY od.id_order_detail`,
            [id]
        )
        console.log("afte try result >> ", result)
        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Not found data"
            })
            return
        }
        const rows = result.rows

        const order = {
            id_order: rows[0].id_order,
            id_customer: rows[0].id_customer,
            order_date: rows[0].order_date,
            status: rows[0].status,

            items: rows.map(row => ({
                id_product: row.id_product,
                name: row.name,
                quantity: row.quantity,
                price: row.price,
                subtotal: Number(row.subtotal)
            })),

            total: rows.reduce(
                (sum, row) => sum + Number(row.subtotal),
                0
            )
        }
        console.log("create order")
        res.json(order)
    } catch (error) {
        console.log("insert order fail")
        res.status(500).json({
            message: "insert order fail"
        })
    }
})

app.post("/book/", upload.single("image"), async (req, res) => {
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



app.post("/order", async (req, res) => {

    const { id_customer, items } = req.body

    if (!id_customer || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
            message: "Invalid order data"
        })
        return
    }

    const client = await pool.connect()

    try {

        await client.query("BEGIN")

        const customerResult = await client.query(
            `SELECT id_customer
             FROM customers
             WHERE id_customer = $1`,
            [id_customer]
        )

        if (customerResult.rows.length === 0) {
            throw new Error("Customer not found")
        }

        const orderResult = await client.query(
            `INSERT INTO orders (id_customer)
             VALUES ($1)
             RETURNING *`,
            [id_customer]
        )

        const id_order = orderResult.rows[0].id_order

        for (const item of items) {

            if (!item.quantity || item.quantity <= 0) {
                throw new Error("Invalid quantity")
            }

            const productResult = await client.query(
                `SELECT id, name, price
                 FROM products
                 WHERE id = $1`,
                [item.id_product]
            )

            if (productResult.rows.length === 0) {
                throw new Error(
                    `Product ${item.id_product} not found`
                )
            }

            const product = productResult.rows[0]

            await client.query(
                `INSERT INTO order_details
                 (id_order, id_product, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [
                    id_order,
                    item.id_product,
                    item.quantity,
                    product.price
                ]
            )
        }

        await client.query("COMMIT")

        res.status(201).json({
            message: "Order created successfully",
            id_order
        })

    } catch (error) {

        await client.query("ROLLBACK")

        console.error(error)

        res.status(500).json({
            message: "Failed to create order"
        })

    } finally {

        client.release()

    }
})

app.listen(3001, () => {
    console.log("Running on 3001")
})