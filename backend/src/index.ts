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

app.get("/order/unassigned", async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                o.id_order,
                o.id_cust,
                o.order_date,
                o.status,
                SUM(od.quantity * od.price) AS total
            FROM orders o
            JOIN order_detail od
                ON o.id_order = od.id_order
            WHERE o.id_emp IS NULL
            GROUP BY
                o.id_order,
                o.id_cust,
                o.order_date,
                o.status
            ORDER BY o.id_order
            `
        )

        res.json(result.rows)

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Failed to get unassigned orders"
        })
    }
})

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
            id_cust: rows[0].id_cust,
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

app.get("/order/employee/:id_emp", async (req, res) => {

    const id_emp = Number(req.params.id_emp)

    if (Number.isNaN(id_emp)) {
        res.status(400).json({
            message: "Invalid Employee id"
        })
        return
    }

    try {

        // ตรวจว่า Employee มีจริง
        const employeeResult = await pool.query(
            `
            SELECT id_emp
            FROM employees
            WHERE id_emp = $1
            `,
            [id_emp]
        )

        if (employeeResult.rows.length === 0) {
            res.status(404).json({
                message: "Employee not found"
            })
            return
        }

        // ดึง Order ที่ Employee คนนี้รับผิดชอบ
        const result = await pool.query(
            `
            SELECT
                o.id_order,
                o.id_cust,
                o.id_emp,
                o.order_date,
                o.status,
                SUM(od.quantity * od.price) AS total
            FROM orders o
            JOIN order_detail od
                ON o.id_order = od.id_order
            WHERE o.id_emp = $1
            GROUP BY
                o.id_order,
                o.id_cust,
                o.id_emp,
                o.order_date,
                o.status
            ORDER BY o.id_order
            `,
            [id_emp]
        )

        res.json(result.rows)

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Failed to get employee orders"
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
            SELECT id_cust
            FROM customer
            WHERE id_cust = $1
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
//++++++++++++++++++++++++++++++++++++++++ ASSIGN ++++++++++++++++++++++++++++++++++++++++

app.patch("/order/:id/assign", async (req, res) => {
    console.log(">>> ASSIGN ORDER ROUTE <<<")
    const id_order = Number(req.params.id)
    const { id_emp } = req.body

    if (Number.isNaN(id_order)) {
        res.status(400).json({
            message: "Invalid Order id"
        })
        return
    }

    if (!id_emp) {
        res.status(400).json({
            message: "Employee id is required"
        })
        return
    }

    try {

        // ตรวจว่า Employee มีจริง
        const employeeResult = await pool.query(
            `
            SELECT id_emp
            FROM employees
            WHERE id_emp = $1
            `,
            [id_emp]
        )

        if (employeeResult.rows.length === 0) {
            res.status(404).json({
                message: "Employee not found",
                id_emp: id_emp
            })
            return
        }

        // ตรวจว่า Order มีจริงและยังไม่มีคนรับ
        const orderCheck = await pool.query(
            `
            SELECT id_order, id_emp, status
            FROM orders
            WHERE id_order = $1
            `,
            [id_order]
        )

        if (orderCheck.rows.length === 0) {
            res.status(404).json({
                message: "Order not found"
            })
            return
        }

        if (orderCheck.rows[0].id_emp !== null) {
            res.status(409).json({
                message: "Order already assigned"
            })
            return
        }

        const result = await pool.query(
            `
            UPDATE orders
            SET id_emp = $1,
                status = 'PROCESSING'
            WHERE id_order = $2
            RETURNING *
            `,
            [id_emp, id_order]
        )

        res.json(result.rows[0])

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Failed to assign order"
        })
    }
})

app.listen(3000, () => {
    console.log("Running on 3000")
})

// +++++++++++++++++++++++++++++++++++++++++ Path ++++++++++++++++++++++++++++++++++++

app.patch("/order/:id/status", async (req, res) => {

    const id_order = Number(req.params.id)
    const { status } = req.body

    if (Number.isNaN(id_order)) {
        res.status(400).json({
            message: "Invalid Order id"
        })
        return
    }

    const allowedStatus = [
        "PROCESSING",
        "PAID",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
    ]

    if (!allowedStatus.includes(status)) {
        res.status(400).json({
            message: "Invalid status"
        })
        return
    }

    try {

        const orderResult = await pool.query(
            `
            SELECT id_order, id_emp, status
            FROM orders
            WHERE id_order = $1
            `,
            [id_order]
        )

        if (orderResult.rows.length === 0) {
            res.status(404).json({
                message: "Order not found"
            })
            return
        }

        const order = orderResult.rows[0]

        const currentStatus = order.status

        // กำหนดสถานะถัดไป
        const nextStatus = {
            PENDING: "PROCESSING",
            PROCESSING: "PAID",
            PAID: "SHIPPED",
            SHIPPED: "DELIVERED"
        }

        if (status === "CANCELLED") {

            if (
                currentStatus === "SHIPPED" ||
                currentStatus === "DELIVERED"
            ) {
                res.status(409).json({
                    message: "Cannot cancel this order"
                })
                return
            }

        } else {

            if (nextStatus[currentStatus] !== status) {

                res.status(409).json({
                    message:
                        `Cannot change status from ${currentStatus} to ${status}`
                })

                return
            }
        }

        const result = await pool.query(
            `
            UPDATE orders
            SET status = $1
            WHERE id_order = $2
            RETURNING *
            `,
            [status, id_order]
        )

        res.json(result.rows[0])

    } catch (error) {

        console.error(error)

        res.status(500).json({
            message: "Failed to update order status"
        })
    }
})