import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { env } from "src/config/env";
import tasks from "src/routers/api/tasks.router";
import auth from "src/routers/auth/auth.router";

const app = new Hono()
  .use(etag(), logger(), requestId())
  .get("/", (c) => c.text("Hono!"))
  .route("/auth", auth)
  .route("/api", new Hono().route("/tasks", tasks));

showRoutes(app);
export default {
  fetch: app.fetch,
  port: env.PORT,
};
