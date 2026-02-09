import Redis from "ioredis";
import { env } from "src/config/env";

const redis = new Redis(env.REDIS_URL);

redis
  .on("error", (err) => console.error("Redis error:", err))
  .on("connect", () => console.log("Connected to Redis"));

export default redis;
