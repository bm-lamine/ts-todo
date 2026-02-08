import { router } from "common/lib/hono";
import { showRoutes } from "hono/dev";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

const app = router()
  .use(etag(), logger(), requestId())
  .get("/", (c) => c.text("Hello Bun!"));

showRoutes(app);

export default app;
