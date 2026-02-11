import { desc, eq } from "drizzle-orm";
import { db, schema } from "src/db";
import forget from "src/helpers/promise-forget";
import TaskModel, { type TTaskCreateInput } from "src/models/tasks.model";
import redis from "src/redis";
import { TTL } from "src/redis/constants";
import CacheService from "src/services/cache.service";
import z from "zod";

export default class TasksRepo {
  static TASKS_KEY = (userId: string) => `task:${userId}`;
  static TASKS_TTL = TTL["1h"];

  static query = db.select().from(schema.tasks).$dynamic();
  static async create(userId: string, values: TTaskCreateInput) {
    const [created] = await db
      .insert(schema.tasks)
      .values({ userId, ...values })
      .returning();

    if (created) forget(redis.del(this.TASKS_KEY(userId)));
    return created;
  }

  static async list(userId: string) {
    const key = this.TASKS_KEY(userId);
    const cached = await CacheService.get(key, z.array(TaskModel.base));
    if (cached) return cached;

    return await this.query
      .where(eq(schema.tasks.userId, userId))
      .orderBy(desc(schema.tasks.createdAt));
  }
}
