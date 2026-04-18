import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { getDatabaseConfig } from "@/shared/config/database.config.js";

const config = getDatabaseConfig();

const pool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    max: config.maxConnections,
    idleTimeoutMillis: config.idleTimeout,
    connectionTimeoutMillis: config.connectionTimeout,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
    console.log("Connection established");
});

pool.on("error", (err) => {
    console.error("Connection pool error", err);
    process.exit(-1);
});

export const db = drizzle(pool);
export { pool };
