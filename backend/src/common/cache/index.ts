import { env } from "common/env";
import Redis from "ioredis";

export const cache = new Redis(env.REDIS_URL);

cache.on("error", (err) => console.error("Redis Error \n", err));
cache.on("connect", () => console.log("Connected to Redis"));
