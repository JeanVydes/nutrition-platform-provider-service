import dotenv from "dotenv";
import { z, ZodError } from "zod";

dotenv.config();

const databaseSchema = z.object({
    host: z.string().default("localhost"),
    port: z.number().default(5432),
    user: z.string().min(1, "User is required"),
    password: z.string().min(1, "Password is required"),
    database: z.string().min(1, "Database name is required"),
    maxConnections: z.number().default(10),
    idleTimeout: z.number().default(30000),
    connectionTimeout: z.number().default(5000),
    ssl: z.boolean().default(false),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;

export const getDatabaseConfig = (): DatabaseConfig => {
    const config = databaseSchema.safeParse({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432", 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
        connectionTimeout: parseInt(
            process.env.DB_CONNECTION_TIMEOUT || "5000",
            10,
        ),
        ssl: process.env.NODE_ENV === "production",
    });

    if (!config.success) {
        const errorMessages = formatZodError(config.error);
        throw new Error(`Invalid configuration:\n${errorMessages}`);
    }

    return config.data;
};

function formatZodError(error: ZodError): string {
    return error.issues
        .map((issue) => {
            const field = issue.path.length > 0 ? issue.path.join(".") : "unknown";
            const message = issue.message;
            return `  • ${field}: ${message}`;
        })
        .join("\n");
}
