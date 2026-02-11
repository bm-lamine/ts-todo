import Redis from "ioredis";
import { env } from "src/config/env";
import type { z, ZodType } from "zod";

export const redis = new Redis(env.REDIS_URL)
  .on("error", (err) => console.error("Redis error:", err))
  .on("connect", () => console.log("Connected to Redis"));

export default class CacheService {
  static async get<T extends ZodType>(
    key: string,
    schema: T,
    del = false,
  ): Promise<z.infer<T> | null> {
    const stored = del ? await redis.getdel(key) : await redis.get(key);
    if (!stored) return null;

    const parsed = schema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  }
}
