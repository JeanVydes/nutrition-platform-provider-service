import type { Config } from "drizzle-kit";

export default {
    schema:
        "./src/modules/locations/infrastructure/drizzle/repositories/location.schema.ts",
    out: "./migrations",
    dialect: "postgresql",
} satisfies Config;
