import { Pool } from "pg"

const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "HuawenShuge",
    user: "postgres",
    password: "Golfring02"
})

export default pool