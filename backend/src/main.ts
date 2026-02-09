import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { env } from "src/config/env";
import { auth } from "src/routes/auth";

const app = new Hono()
  .use(etag(), logger(), requestId())
  .get("/", (c) => c.text("Hono!"))
  .route("/auth", auth);

showRoutes(app);
export default {
  fetch: app.fetch,
  port: env.PORT,
};
