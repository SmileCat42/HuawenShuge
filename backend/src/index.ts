import express from "express"
import multer from "multer"
import cors from 'cors';
import pool from "./db.js"

const app = express()

app.use(cors({
    origin: "http://localhost:5173"
}))

app.use(express.json())

// +++++++++++++++++++++++++++++++++  GET  +++++++++++++++++++++++++++++++++++++

app.get("/book", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT * FROM products"
        )

        res.json(result.rows)

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Database error"
        })
    }
})
app.get("/book/:id", async (req, res) => {

    const id = Number(req.params.id)

    if (Number.isNaN(id)) {
        res.status(400).json({
            message: "Invalid Book id"
        })
        return
    }

    try {

        const result = await pool.query(
            "SELECT * FROM products WHERE id = $1",
            [id]
        )

        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Book not found"
            })
            return
        }

        res.json(result.rows[0])

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Database error"
        })
    }
})

app.get("/order", async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT
                o.id_order,
                o.id_cust,
                o.order_date,
                o.status,
                SUM(od.quantity * od.price) AS total
             FROM orders o
             JOIN order_detail od
                ON o.id_order = od.id_order
             GROUP BY
                o.id_order,
                o.id_cust,
                o.order_date,
                o.status
             ORDER BY o.id_order`
        )

        res.json(result.rows)

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Failed to get orders"
        })
    }
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

// +++++++++++++++++++++++++++++++++++++++++ POST  ++++++++++++++++++++++++++++++++

app.post("/book", async (req, res) => {

    const obj = req.body

    if (!obj.name || !obj.price) {
        res.status(400).json({
            message: "Invalid data"
        })
        return
    }

    if (
        typeof obj.name !== "string" ||
        typeof obj.price !== "number"
    ) {
        res.status(400).json({
            message: "Wrong type data"
        })
        return
    }

    if (obj.name === "" || obj.price <= 0) {
        res.status(400).json({
            message: "Invalid name or price"
        })
        return
    }

    try {

        const result = await pool.query(
            `INSERT INTO products
             (name, price, author, detail, image_path)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                obj.name,
                obj.price,
                obj.author,
                obj.detail,
                obj.image_path ?? "/images/default.png"
            ]
        )

        res.status(201).json(result.rows[0])

    } catch (error) {

        console.error("DB Insert Error:", error)

        res.status(500).json({
            message: "Database error"
        })
    }
})

app.post("/order", async (req, res) => {

    const { id_cust, items, id_emp } = req.body

    if (
        !id_cust ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        res.status(400).json({
            message: "Invalid order data"
        })
        return
    }

    const client = await pool.connect()

    try {

        await client.query("BEGIN")

        // 1. Check Customer
        const customerResult = await client.query(
            `
            SELECT id_customer
            FROM customers
            WHERE id_customer = $1
            `,
            [id_cust]
        )

        if (customerResult.rows.length === 0) {
            throw new Error("Customer not found")
        }

        // 2. Create Order
        const orderResult = await client.query(
            `
            INSERT INTO orders
                (id_cust, id_emp)
            VALUES
                ($1, $2)
            RETURNING *
            `,
            [id_cust, id_emp ?? null]
        )

        const id_order = orderResult.rows[0].id_order

        // 3. Create Order Details
        for (const item of items) {

            if (
                !item.id_product ||
                !item.quantity ||
                item.quantity <= 0
            ) {
                throw new Error("Invalid order item")
            }

            const productResult = await client.query(
                `
                SELECT id, name, price
                FROM products
                WHERE id = $1
                `,
                [item.id_product]
            )

            if (productResult.rows.length === 0) {
                throw new Error(
                    `Product ${item.id_product} not found`
                )
            }

            const product = productResult.rows[0]

            await client.query(
                `
                INSERT INTO order_detail
                    (id_order, id_product, quantity, price)
                VALUES
                    ($1, $2, $3, $4)
                `,
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
            id_order: id_order
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



// +++++++++++++++++++++++++++++++ PUT ++++++++++++++++++++++++++++++

app.put("/book/:id", async (req, res) => {

    const id = Number(req.params.id)

    if (Number.isNaN(id)) {
        res.status(400).json({
            message: "Invalid Book id"
        })
        return
    }

    const obj = req.body

    if (!obj.name || !obj.price) {
        res.status(400).json({
            message: "Please fill detail"
        })
        return
    }

    if (
        typeof obj.name !== "string" ||
        typeof obj.price !== "number"
    ) {
        res.status(400).json({
            message: "Wrong type"
        })
        return
    }

    if (obj.price <= 0) {
        res.status(400).json({
            message: "Price must be more than 0"
        })
        return
    }

    try {

        const result = await pool.query(
            `UPDATE products
             SET name = $1,
                 price = $2,
                 author = $3,
                 detail = $4
             WHERE id = $5
             RETURNING *`,
            [
                obj.name,
                obj.price,
                obj.author,
                obj.detail,
                id
            ]
        )

        if (result.rowCount === 0) {
            res.status(404).json({
                message: "Book not found"
            })
            return
        }

        res.json(result.rows[0])

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Database error"
        })
    }
})

// ++++++++++++++++++++++++++++++++++++++ DELETE +++++++++++++++++++++++++++++

app.delete("/book/:id", async (req, res) => {

    const id = Number(req.params.id)

    if (Number.isNaN(id)) {
        res.status(400).json({
            message: "Invalid Book id"
        })
        return
    }

    try {

        const result = await pool.query(
            "DELETE FROM products WHERE id = $1",
            [id]
        )

        if (result.rowCount === 0) {
            res.status(404).json({
                message: "Book not found"
            })
            return
        }

        res.json({
            message: "Delete success!",
            id: id
        })

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Database error"
        })
    }
})

app.listen(3000, () => {
    console.log("Running on 3000")
})