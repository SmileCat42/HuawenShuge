import express from "express";
import multer from "multer";
import cors from 'cors';
import pool from "./db.js";
const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());
const upload = multer({
    storage: multer.memoryStorage()
});
// +++++++++++++++++++++++++++++++++  GET  +++++++++++++++++++++++++++++++++++++
app.get("/admin/:id_emp/accounts", async (req, res) => {
    const id_emp = Number(req.params.id_emp);
    if (!Number.isInteger(id_emp) || id_emp <= 0) {
        res.status(400).json({ message: "Invalid admin id" });
        return;
    }
    try {
        const adminCheck = await pool.query(`
            SELECT e.id_emp
            FROM employees e
            JOIN roles r ON e.id_role = r.id_role
            WHERE e.id_emp = $1
              AND r.role_name = 'admin'
            `, [id_emp]);
        if (adminCheck.rows.length === 0) {
            res.status(403).json({
                message: "Only Admin can view accounts"
            });
            return;
        }
        const result = await pool.query(`
            SELECT
                a.id_acc,
                a.username,
                a.id_person,
                p.fname,
                p.lname,
                c.id_cust,
                e.id_emp AS employee_id,
                r.role_name AS employee_role,
                CASE
                    WHEN e.id_emp IS NOT NULL THEN r.role_name
                    WHEN c.id_cust IS NOT NULL THEN 'customer'
                    ELSE 'unknown'
                END AS role
            FROM account a
            JOIN person p ON a.id_person = p.id_person
            LEFT JOIN customer c ON a.id_person = c.id_person
            LEFT JOIN employees e ON a.id_person = e.id_person
            LEFT JOIN roles r ON e.id_role = r.id_role
            ORDER BY a.id_acc
            `);
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to get accounts"
        });
    }
});
app.get("/order/:id_order/slip", async (req, res) => {
    const id_order = Number(req.params.id_order);
    if (Number.isNaN(id_order)) {
        res.status(400).send("Invalid order id");
        return;
    }
    try {
        const result = await pool.query(`
                    SELECT
                        payment_slip
                    FROM orders
                    WHERE id_order = $1
                    `, [id_order]);
        if (result.rows.length === 0) {
            res.status(404).send("Order not found");
            return;
        }
        const row = result.rows[0];
        if (!row.payment_slip) {
            res.status(404).send("Payment slip not found");
            return;
        }
        res.setHeader("Content-Type", "image/jpeg");
        res.end(row.payment_slip);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Failed to get payment slip");
    }
});
app.get("/wishlist/customer/:id_cust", async (req, res) => {
    const id_cust = Number(req.params.id_cust);
    if (Number.isNaN(id_cust)) {
        res.status(400).json({
            message: "Invalid Customer id"
        });
        return;
    }
    try {
        const result = await pool.query(`
            SELECT
                w.id_wishlist,
                w.id_cust,
                p.id,
                p.name,
                p.price,
                p.author,
                p.image
            FROM wishlist w
            JOIN products p
                ON w.id_product = p.id
            WHERE w.id_cust = $1
            ORDER BY w.id_wishlist DESC
            `, [id_cust]);
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to get wishlist"
        });
    }
});
app.get("/account/:id_acc", async (req, res) => {
    console.log("GET account");
    const id_acc = Number(req.params.id_acc);
    if (Number.isNaN(id_acc)) {
        res.status(400).json({
            message: "Invalid Account id"
        });
        return;
    }
    try {
        const result = await pool.query(`
            SELECT
                a.id_acc,
                a.id_person,
                a.username,
                p.fname,
                p.lname,
                p.birthyear,
                p.address,
                p.tel,
                (a.image IS NOT NULL) AS has_image
            FROM account a
            JOIN person p
                ON a.id_person = p.id_person
            WHERE a.id_acc = $1
            `, [id_acc]);
        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Account not found"
            });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to get account"
        });
    }
});
app.get("/order/customer/:id_cust", async (req, res) => {
    const id_cust = Number(req.params.id_cust);
    if (Number.isNaN(id_cust)) {
        res.status(400).json({
            message: "Invalid Customer id"
        });
        return;
    }
    try {
        const customerResult = await pool.query(`
            SELECT id_cust
            FROM customer
            WHERE id_cust = $1
            `, [id_cust]);
        if (customerResult.rows.length === 0) {
            res.status(404).json({
                message: "Customer not found"
            });
            return;
        }
        const result = await pool.query(`
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
            WHERE o.id_cust = $1
            GROUP BY
                o.id_order,
                o.id_cust,
                o.id_emp,
                o.order_date,
                o.status
            ORDER BY o.id_order DESC
            `, [id_cust]);
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to get customer orders"
        });
    }
});
app.get("/order/unassigned", async (req, res) => {
    try {
        const result = await pool.query(`
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
            `);
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to get unassigned orders"
        });
    }
});
app.get("/book", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products");
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database error"
        });
    }
});
app.get("/book/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({
            message: "Invalid Book id"
        });
        return;
    }
    try {
        const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Book not found"
            });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database error"
        });
    }
});
app.get("/order", async (req, res) => {
    try {
        const result = await pool.query(`SELECT
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
             ORDER BY o.id_order`);
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to get orders"
        });
    }
});
app.get("/order/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(200).json({
            message: "Invalid path"
        });
        return;
    }
    try {
        console.log("into try");
        const result = await pool.query(`SELECT
        o.id_order,
        o.id_cust,
        o.id_emp,
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
     ORDER BY od.id_order_detail`, [id]);
        console.log("afte try result >> ", result);
        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Not found data"
            });
            return;
        }
        const rows = result.rows;
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
            total: rows.reduce((sum, row) => sum + Number(row.subtotal), 0)
        };
        console.log("create order");
        res.json(order);
    }
    catch (error) {
        console.log("insert order fail");
        res.status(500).json({
            message: "insert order fail"
        });
    }
});
app.get("/account/:id_acc/profile-image", async (req, res) => {
    const id_acc = Number(req.params.id_acc);
    if (Number.isNaN(id_acc)) {
        res.status(400).send("Invalid account id");
        return;
    }
    const result = await pool.query(`SELECT image
         FROM account
         WHERE id_acc = $1`, [id_acc]);
    if (result.rows.length === 0) {
        res.status(404).send("Account not found");
        return;
    }
    if (!result.rows[0].image) {
        res.status(404).send("Profile image not found");
        return;
    }
    res.setHeader("Content-Type", "image/jpeg");
    res.end(result.rows[0].image);
});
app.get("/order/employee/:id_emp", async (req, res) => {
    const id_emp = Number(req.params.id_emp);
    if (Number.isNaN(id_emp)) {
        res.status(400).json({
            message: "Invalid Employee id"
        });
        return;
    }
    try {
        // ตรวจว่า Employee มีจริง
        const employeeResult = await pool.query(`
            SELECT id_emp
            FROM employees
            WHERE id_emp = $1
            `, [id_emp]);
        if (employeeResult.rows.length === 0) {
            res.status(404).json({
                message: "Employee not found"
            });
            return;
        }
        // ดึง Order ที่ Employee คนนี้รับผิดชอบ
        const result = await pool.query(`
            SELECT
                o.id_order,
                o.id_cust,
                o.id_emp,
                o.order_date,
                o.status,
                SUM(od.quantity * od.price) AS total,
                BOOL_OR(o.payment_slip IS NOT NULL) AS has_slip
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
            `, [id_emp]);
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to get employee orders"
        });
    }
});
// +++++++++++++++++++++++++++++++++++++++++ POST  ++++++++++++++++++++++++++++++++
app.post("/order/:id_order/slip", upload.single("slip"), async (req, res) => {
    const id_order = Number(req.params.id_order);
    if (Number.isNaN(id_order)) {
        res.status(400).json({
            message: "Invalid order id"
        });
        return;
    }
    if (!req.file) {
        res.status(400).json({
            message: "Payment slip is required"
        });
        return;
    }
    try {
        const result = await pool.query(`
            UPDATE orders
            SET
                payment_slip = $1,
                slip_uploaded_at = NOW()
            WHERE id_order = $2
            RETURNING
                id_order,
                status,
                slip_uploaded_at
        `, [
            req.file.buffer,
            id_order
        ]);
        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Order not found"
            });
            return;
        }
        res.json({
            message: "Payment slip uploaded successfully",
            order: result.rows[0]
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to upload payment slip"
        });
    }
});
app.post("/wishlist", async (req, res) => {
    const { id_cust, id_product } = req.body;
    if (!id_cust || !id_product) {
        res.status(400).json({
            message: "Customer and product are required"
        });
        return;
    }
    try {
        const result = await pool.query(`
            INSERT INTO wishlist
                (id_cust, id_product)
            VALUES
                ($1, $2)
            RETURNING *
            `, [id_cust, id_product]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        if (error.code === "23505") {
            res.status(409).json({
                message: "Product already in wishlist"
            });
            return;
        }
        res.status(500).json({
            message: "Failed to add wishlist"
        });
    }
});
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({
            message: "Username and password are required"
        });
        return;
    }
    try {
        const result = await pool.query(`
            SELECT
                a.id_acc,
                a.id_person,
                a.username,
                a.password,
                c.id_cust AS id_cust,
                e.id_emp,
                e.id_role
            FROM account a
            JOIN person p
                ON a.id_person = p.id_person
            LEFT JOIN customer c
                ON a.id_person = c.id_person
            LEFT JOIN employees e
                ON a.id_person = e.id_person
            LEFT JOIN roles r
                ON e.id_role = r.id_role
            WHERE a.username = $1
            `, [username]);
        if (result.rows.length === 0) {
            res.status(401).json({
                message: "Username or password is incorrect"
            });
            return;
        }
        const account = result.rows[0];
        if (password !== account.password) {
            res.status(401).json({
                message: "Username or password is incorrect"
            });
            return;
        }
        res.json({
            id_acc: account.id_acc,
            id_person: account.id_person,
            username: account.username,
            id_cust: account.id_cust,
            id_emp: account.id_emp,
            id_role: account.id_role
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Login failed"
        });
    }
});
app.post("/book", async (req, res) => {
    const obj = req.body;
    if (!obj.name || !obj.price) {
        res.status(400).json({
            message: "Invalid data"
        });
        return;
    }
    if (typeof obj.name !== "string" ||
        typeof obj.price !== "number") {
        res.status(400).json({
            message: "Wrong type data"
        });
        return;
    }
    if (obj.name === "" || obj.price <= 0) {
        res.status(400).json({
            message: "Invalid name or price"
        });
        return;
    }
    try {
        const result = await pool.query(`INSERT INTO products
             (name, price, author, detail, image)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`, [
            obj.name,
            obj.price,
            obj.author,
            obj.detail,
            obj.image ?? "/images/newbook.png"
        ]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error("DB Insert Error:", error);
        res.status(500).json({
            message: "Database error"
        });
    }
});
app.post("/order", async (req, res) => {
    const { id_cust, items, id_emp } = req.body;
    if (!id_cust ||
        !Array.isArray(items) ||
        items.length === 0) {
        res.status(400).json({
            message: "Invalid order data"
        });
        return;
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // 1. Check Customer
        const customerResult = await client.query(`
            SELECT id_cust
            FROM customer
            WHERE id_cust = $1
            `, [id_cust]);
        if (customerResult.rows.length === 0) {
            throw new Error("Customer not found");
        }
        // 2. Create Order
        const orderResult = await client.query(`
            INSERT INTO orders
                (id_cust, id_emp)
            VALUES
                ($1, $2)
            RETURNING *
            `, [id_cust, id_emp ?? null]);
        const id_order = orderResult.rows[0].id_order;
        // 3. Create Order Details
        for (const item of items) {
            if (!item.id_product ||
                !item.quantity ||
                item.quantity <= 0) {
                throw new Error("Invalid order item");
            }
            const productResult = await client.query(`
                SELECT id, name, price
                FROM products
                WHERE id = $1
                `, [item.id_product]);
            if (productResult.rows.length === 0) {
                throw new Error(`Product ${item.id_product} not found`);
            }
            const product = productResult.rows[0];
            await client.query(`
                INSERT INTO order_detail
                    (id_order, id_product, quantity, price)
                VALUES
                    ($1, $2, $3, $4)
                `, [
                id_order,
                item.id_product,
                item.quantity,
                product.price
            ]);
        }
        await client.query("COMMIT");
        res.status(201).json({
            message: "Order created successfully",
            id_order: id_order
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        res.status(500).json({
            message: "Failed to create order"
        });
    }
    finally {
        client.release();
    }
});
app.post("/register", async (req, res) => {
    const { fname, lname, birthyear, address, tel, username, password } = req.body;
    if (!fname ||
        !lname ||
        !birthyear ||
        !address ||
        !tel ||
        !username ||
        !password) {
        res.status(400).json({
            message: "Please fill all fields"
        });
        return;
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // 1. Create Person
        const personResult = await client.query(`
            INSERT INTO person
                (fname, lname, birthyear, address, tel)
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING id_person
            `, [
            fname,
            lname,
            birthyear,
            address,
            tel
        ]);
        const id_person = personResult.rows[0].id_person;
        // 2. Create Customer
        const customerResult = await client.query(`
            INSERT INTO customer
                (id_person)
            VALUES
                ($1)
            RETURNING id_cust
            `, [id_person]);
        const id_cust = customerResult.rows[0].id_cust;
        // 3. Create Account
        const accountResult = await client.query(`
            INSERT INTO account
                (id_person, username, password)
            VALUES
                ($1, $2, $3)
            RETURNING id_acc, username
            `, [
            id_person,
            username,
            password
        ]);
        await client.query("COMMIT");
        res.status(201).json({
            message: "Register successful",
            id_person: id_person,
            id_cust: id_cust,
            account: accountResult.rows[0]
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        if (error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "23505") {
            res.status(409).json({
                message: "Username already exists"
            });
            return;
        }
        res.status(500).json({
            message: "Register failed"
        });
    }
    finally {
        client.release();
    }
});
// +++++++++++++++++++++++++++++++ PUT ++++++++++++++++++++++++++++++
app.put("/book/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({
            message: "Invalid Book id"
        });
        return;
    }
    const obj = req.body;
    if (!obj.name || !obj.price) {
        res.status(400).json({
            message: "Please fill detail"
        });
        return;
    }
    if (typeof obj.name !== "string" ||
        typeof obj.price !== "number") {
        res.status(400).json({
            message: "Wrong type"
        });
        return;
    }
    if (obj.price <= 0) {
        res.status(400).json({
            message: "Price must be more than 0"
        });
        return;
    }
    try {
        const result = await pool.query(`UPDATE products
     SET name = $1,
         price = $2,
         author = $3,
         detail = $4,
         image = CASE
             WHEN $5 = '' THEN image
             ELSE $5
         END
     WHERE id = $6
     RETURNING *`, [
            obj.name,
            obj.price,
            obj.author,
            obj.detail,
            obj.image ?? "",
            id
        ]);
        if (result.rowCount === 0) {
            res.status(404).json({
                message: "Book not found"
            });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database error"
        });
    }
});
app.put("/account/:id_acc", async (req, res) => {
    const id_acc = Number(req.params.id_acc);
    if (Number.isNaN(id_acc)) {
        res.status(400).json({
            message: "Invalid account id"
        });
        return;
    }
    const { fname, lname, birthyear, address, tel } = req.body;
    if (!fname ||
        !lname ||
        !birthyear ||
        !address ||
        !tel) {
        res.status(400).json({
            message: "Please fill all fields"
        });
        return;
    }
    try {
        const result = await pool.query(`
            UPDATE person p
            SET
                fname = $1,
                lname = $2,
                birthyear = $3,
                address = $4,
                tel = $5
            FROM account a
            WHERE
                a.id_acc = $6
                AND p.id_person = a.id_person
            RETURNING
                p.id_person,
                p.fname,
                p.lname,
                p.birthyear,
                p.address,
                p.tel
            `, [
            fname,
            lname,
            birthyear,
            address,
            tel,
            id_acc
        ]);
        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Account not found"
            });
            return;
        }
        res.json({
            message: "Profile updated successfully",
            person: result.rows[0]
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to update profile"
        });
    }
});
app.put("/admin/:id_emp/accounts/:id_person/role", async (req, res) => {
    const id_emp = Number(req.params.id_emp);
    const id_person = Number(req.params.id_person);
    const { role_name } = req.body;
    if (!Number.isInteger(id_emp) || id_emp <= 0 ||
        !Number.isInteger(id_person) || id_person <= 0) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    if (!["staff", "manager"].includes(role_name)) {
        res.status(400).json({
            message: "This route only supports Staff and Manager promotion"
        });
        return;
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const adminCheck = await client.query(`
                SELECT e.id_emp
                FROM employees e
                JOIN roles r ON e.id_role = r.id_role
                WHERE e.id_emp = $1
                  AND r.role_name = 'admin'
                `, [id_emp]);
        if (adminCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            res.status(403).json({
                message: "Only Admin can change roles"
            });
            return;
        }
        const personCheck = await client.query(`
                SELECT p.id_person, c.id_cust, e.id_emp AS employee_id,
                       r.role_name AS current_role
                FROM person p
                LEFT JOIN customer c ON p.id_person = c.id_person
                LEFT JOIN employees e ON p.id_person = e.id_person
                LEFT JOIN roles r ON e.id_role = r.id_role
                WHERE p.id_person = $1
                FOR UPDATE OF p
                `, [id_person]);
        if (personCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            res.status(404).json({ message: "Person not found" });
            return;
        }
        const person = personCheck.rows[0];
        if (person.current_role === "admin") {
            await client.query("ROLLBACK");
            res.status(403).json({
                message: "Changing Admin roles is not allowed here"
            });
            return;
        }
        const roleResult = await client.query(`SELECT id_role FROM roles WHERE role_name = $1`, [role_name]);
        if (roleResult.rows.length === 0) {
            await client.query("ROLLBACK");
            res.status(404).json({ message: "Role not found" });
            return;
        }
        if (person.employee_id) {
            await client.query(`
                    UPDATE employees
                    SET id_role = $1
                    WHERE id_person = $2
                    `, [roleResult.rows[0].id_role, id_person]);
        }
        else {
            if (!person.id_cust || role_name !== "staff") {
                await client.query("ROLLBACK");
                res.status(400).json({
                    message: "Only an existing Customer can be promoted to Staff"
                });
                return;
            }
            await client.query(`
                    INSERT INTO employees (id_person, id_role)
                    VALUES ($1, $2)
                    `, [id_person, roleResult.rows[0].id_role]);
        }
        await client.query("COMMIT");
        res.json({
            message: `Role changed to ${role_name} successfully`
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        res.status(500).json({
            message: "Failed to change role"
        });
    }
    finally {
        client.release();
    }
});
// ++++++++++++++++++++++++++++++++++++++ DELETE +++++++++++++++++++++++++++++
app.delete("/wishlist/:id", async (req, res) => {
    const id_wishlist = Number(req.params.id);
    if (Number.isNaN(id_wishlist)) {
        res.status(400).json({
            message: "Invalid Wishlist id"
        });
        return;
    }
    try {
        const result = await pool.query(`
            DELETE FROM wishlist
            WHERE id_wishlist = $1
            RETURNING *
            `, [id_wishlist]);
        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Wishlist item not found"
            });
            return;
        }
        res.json({
            message: "Removed from wishlist",
            id_wishlist
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to remove wishlist"
        });
    }
});
app.delete("/book/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({
            message: "Invalid Book id"
        });
        return;
    }
    try {
        const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
        if (result.rowCount === 0) {
            res.status(404).json({
                message: "Book not found"
            });
            return;
        }
        res.json({
            message: "Delete success!",
            id: id
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database error"
        });
    }
});
//++++++++++++++++++++++++++++++++++++++++ PROMOTE +++++++++++++++++++++++++++++++++++++++
// GET: Customers who can be promoted to STAFF
app.get("/manager/:id_emp/eligible-customers", async (req, res) => {
    const id_emp = Number(req.params.id_emp);
    if (!Number.isInteger(id_emp) || id_emp <= 0) {
        res.status(400).json({
            message: "Invalid manager id"
        });
        return;
    }
    try {
        // ตรวจสอบว่า Employee คนนี้เป็น Manager จริงในฐานข้อมูล
        const managerCheck = await pool.query(`
            SELECT e.id_emp
            FROM employees e
            JOIN roles r
                ON e.id_role = r.id_role
            WHERE e.id_emp = $1
              AND r.role_name = 'manager'
            `, [id_emp]);
        if (managerCheck.rows.length === 0) {
            res.status(403).json({
                message: "Only Manager can manage employee roles"
            });
            return;
        }
        // แสดงลูกค้าที่มีบัญชี แต่ยังไม่ได้เป็นพนักงาน
        const result = await pool.query(`
            SELECT
                c.id_cust,
                c.id_person,
                a.id_acc,
                a.username,
                p.fname,
                p.lname
            FROM customer c
            JOIN person p
                ON c.id_person = p.id_person
            JOIN account a
                ON a.id_person = p.id_person
            WHERE NOT EXISTS (
                SELECT 1
                FROM employees e
                WHERE e.id_person = c.id_person
            )
            ORDER BY c.id_cust
            `);
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to get eligible customers"
        });
    }
});
// POST: Promote a Customer to STAFF
app.post("/manager/:id_emp/promote/:id_cust", async (req, res) => {
    const manager_id_emp = Number(req.params.id_emp);
    const id_cust = Number(req.params.id_cust);
    if (!Number.isInteger(manager_id_emp) ||
        manager_id_emp <= 0 ||
        !Number.isInteger(id_cust) ||
        id_cust <= 0) {
        res.status(400).json({
            message: "Invalid id"
        });
        return;
    }
    try {
        // 1. ตรวจสอบผู้แต่งตั้งว่าเป็น Manager
        const managerCheck = await pool.query(`
                SELECT e.id_emp
                FROM employees e
                JOIN roles r
                    ON e.id_role = r.id_role
                WHERE e.id_emp = $1
                  AND r.role_name = 'manager'
                `, [manager_id_emp]);
        if (managerCheck.rows.length === 0) {
            res.status(403).json({
                message: "Only Manager can promote customers"
            });
            return;
        }
        // 2. ตรวจสอบว่ามี Customer จริง
        const customerResult = await pool.query(`
                SELECT id_cust, id_person
                FROM customer
                WHERE id_cust = $1
                `, [id_cust]);
        if (customerResult.rows.length === 0) {
            res.status(404).json({
                message: "Customer not found"
            });
            return;
        }
        const id_person = customerResult.rows[0].id_person;
        // 3. ห้ามแต่งตั้งซ้ำ หากเป็น Employee อยู่แล้ว
        const employeeCheck = await pool.query(`
                SELECT id_emp
                FROM employees
                WHERE id_person = $1
                `, [id_person]);
        if (employeeCheck.rows.length > 0) {
            res.status(409).json({
                message: "This person is already an employee"
            });
            return;
        }
        // 4. ค้นหา Role STAFF
        const staffRole = await pool.query(`
                SELECT id_role
                FROM roles
                WHERE role_name = 'staff'
                `);
        if (staffRole.rows.length === 0) {
            res.status(500).json({
                message: "Staff role not found"
            });
            return;
        }
        // 5. สร้าง Employee โดยยังคงข้อมูล Customer ไว้
        const result = await pool.query(`
                INSERT INTO employees (id_person, id_role)
                VALUES ($1, $2)
                RETURNING id_emp, id_person, id_role
                `, [
            id_person,
            staffRole.rows[0].id_role
        ]);
        res.status(201).json({
            message: "Customer promoted to STAFF successfully",
            employee: result.rows[0]
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to promote customer"
        });
    }
});
//++++++++++++++++++++++++++++++++++++++++ ASSIGN ++++++++++++++++++++++++++++++++++++++++
app.patch("/order/:id/assign", async (req, res) => {
    console.log(">>> ASSIGN ORDER ROUTE <<<");
    const id_order = Number(req.params.id);
    const { id_emp } = req.body;
    if (Number.isNaN(id_order)) {
        res.status(400).json({
            message: "Invalid Order id"
        });
        return;
    }
    if (!id_emp) {
        res.status(400).json({
            message: "Employee id is required"
        });
        return;
    }
    try {
        // ตรวจว่า Employee มีจริง
        const employeeResult = await pool.query(`
            SELECT id_emp
            FROM employees
            WHERE id_emp = $1
            `, [id_emp]);
        if (employeeResult.rows.length === 0) {
            res.status(404).json({
                message: "Employee not found",
                id_emp: id_emp
            });
            return;
        }
        // ตรวจว่า Order มีจริงและยังไม่มีคนรับ
        const orderCheck = await pool.query(`
            SELECT id_order, id_emp, status
            FROM orders
            WHERE id_order = $1
            `, [id_order]);
        if (orderCheck.rows.length === 0) {
            res.status(404).json({
                message: "Order not found"
            });
            return;
        }
        if (orderCheck.rows[0].id_emp !== null) {
            res.status(409).json({
                message: "Order already assigned"
            });
            return;
        }
        const result = await pool.query(`
            UPDATE orders
            SET id_emp = $1,
                status = 'PROCESSING'
            WHERE id_order = $2
            RETURNING *
            `, [id_emp, id_order]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to assign order"
        });
    }
});
app.listen(3000, () => {
    console.log("Running on 3000");
});
app.patch("/order/:id/status", async (req, res) => {
    const id_order = Number(req.params.id);
    const status = req.body.status;
    if (Number.isNaN(id_order)) {
        res.status(400).json({
            message: "Invalid Order id"
        });
        return;
    }
    const allowedStatus = [
        "PROCESSING",
        "PAID",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
    ];
    if (!allowedStatus.includes(status)) {
        res.status(400).json({
            message: "Invalid status"
        });
        return;
    }
    try {
        const orderResult = await pool.query(`
            SELECT id_order, id_emp, status
            FROM orders
            WHERE id_order = $1
            `, [id_order]);
        if (orderResult.rows.length === 0) {
            res.status(404).json({
                message: "Order not found"
            });
            return;
        }
        const order = orderResult.rows[0];
        const currentStatus = order.status;
        // กำหนดสถานะถัดไป
        const nextStatus = {
            PENDING: "PROCESSING",
            PROCESSING: "PAID",
            PAID: "SHIPPED",
            SHIPPED: "DELIVERED"
        };
        if (status === "PAID") {
            const slipResult = await pool.query(`
            SELECT payment_slip
            FROM orders
            WHERE id_order = $1
            `, [id_order]);
            if (slipResult.rows.length === 0) {
                res.status(404).json({
                    message: "Order not found"
                });
                return;
            }
            if (!slipResult.rows[0].payment_slip) {
                res.status(400).json({
                    message: "Payment slip not uploaded"
                });
                return;
            }
        }
        if (status === "CANCELLED") {
            if (currentStatus === "SHIPPED" ||
                currentStatus === "DELIVERED") {
                res.status(409).json({
                    message: "Cannot cancel this order"
                });
                return;
            }
        }
        else {
            if (nextStatus[currentStatus] !== status) {
                res.status(409).json({
                    message: `Cannot change status from ${currentStatus} to ${status}`
                });
                return;
            }
        }
        const result = await pool.query(`
            UPDATE orders
            SET status = $1
            WHERE id_order = $2
            RETURNING *
            `, [status, id_order]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to update order status"
        });
    }
});
//# sourceMappingURL=index.js.map