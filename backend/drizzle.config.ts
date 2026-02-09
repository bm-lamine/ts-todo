import { defineConfig } from "drizzle-kit";
import { env } from "src/config/env";

export default defineConfig({
  out: "./out/migrations",
  schema: "./src/db/schema.ts",
  dbCredentials: { url: env.DATABASE_URL },
  dialect: "postgresql",
});
