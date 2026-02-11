import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";
import parser from "src/middlewares/request-parser";
import requireJwt from "src/middlewares/require-jwt";
import { type TJwtPayload } from "src/models/jwt.model";
import TaskModel from "src/models/tasks.model";
import TasksRepo from "src/repo/tasks.repo";

const tasks = new Hono<{
  Variables: JwtVariables<TJwtPayload>;
}>();

tasks
  .get("/", requireJwt, async (ctx) => {
    const payload = ctx.get("jwtPayload");
    const tasks = await TasksRepo.list(payload.sub);
    return ctx.json({ tasks });
  })
  .post("/", requireJwt, parser("json", TaskModel.create), async (ctx) => {
    const payload = ctx.get("jwtPayload");
    const body = ctx.req.valid("json");
    const task = await TasksRepo.create(payload.sub, body);
    return ctx.json({ task });
  });

export default tasks;
