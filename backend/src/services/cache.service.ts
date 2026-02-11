import redis from "src/redis";
import type { z, ZodType } from "zod";

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
