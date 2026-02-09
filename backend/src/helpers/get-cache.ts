import redis from "src/redis";
import type { z, ZodType } from "zod";

export async function getCache<T extends ZodType>(
  options: Options<T>,
  del = false,
): Promise<z.infer<T> | null> {
  const stored = del
    ? await redis.getdel(options.key)
    : await redis.get(options.key);
  if (!stored) return null;

  const parsed = options.schema.safeParse(JSON.parse(stored));
  return parsed.success ? parsed.data : null;
}

export type Options<T> = {
  key: string;
  schema: T;
};
