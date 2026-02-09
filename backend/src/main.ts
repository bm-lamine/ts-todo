import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

const app = new Hono()
  .use(etag(), logger(), requestId())
  .get("/", (c) => c.text("Hono!"));

showRoutes(app);
export default app;
