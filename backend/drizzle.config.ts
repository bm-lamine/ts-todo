import { env } from "common/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
  schema: "./src/common/db/schema.ts",
  out: "./out/migrations",
  verbose: true,
  strict: true,
});
