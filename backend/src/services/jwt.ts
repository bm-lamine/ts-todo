import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { env } from "src/config/env";
import { hash } from "src/helpers/crypto-hash";
import STATUS_CODE from "src/helpers/status-code";
import { JwtModel } from "src/models/jwt.model";
import redis from "src/redis";
import { TTL } from "src/redis/constants";

export const REFRESH_KEY = (userId: string) => `auth:refresh:${userId}`;
export const ACCESS_TTL = TTL["5m"];
export const REFRESH_TTL = TTL["7d"];

export const signJWT = async (payload: JwtModel.Payload, ttl: number) => {
  const now = Math.floor(Date.now() / 1000);
  return await sign(
    { ...payload, iat: now, exp: now + ttl },
    env.JWT_SECRET,
    "HS256",
  );
};

export const verifyJWT = async function (token: string) {
  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");
    const parsed = JwtModel.payload.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export async function authenticate(userId: string) {
  const [accessToken, refreshToken] = await Promise.all([
    signJWT({ sub: userId }, ACCESS_TTL),
    signJWT({ sub: userId }, REFRESH_TTL),
  ]);

  await redis
    .multi()
    .sadd(REFRESH_KEY(userId), hash(refreshToken))
    .expire(REFRESH_KEY(userId), REFRESH_TTL, "NX")
    .exec();

  return { accessToken, refreshToken };
}

export async function refreshAuth(token: string) {
  const payload = await verifyJWT(token);
  if (!payload) {
    throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
      message: "invalid token issued",
    });
  }

  const exists = await redis.sismember(REFRESH_KEY(payload.sub), hash(token));
  if (!exists) {
    throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
      message: "token reuse detected",
    });
  }

  const [accessToken, refreshToken] = await Promise.all([
    signJWT({ sub: payload.sub }, ACCESS_TTL),
    signJWT({ sub: payload.sub }, REFRESH_TTL),
  ]);

  await redis
    .multi()
    .srem(REFRESH_KEY(payload.sub), hash(token))
    .sadd(REFRESH_KEY(payload.sub), hash(refreshToken))
    .expire(REFRESH_KEY(payload.sub), REFRESH_TTL, "NX")
    .exec();

  return { accessToken, refreshToken };
}

export async function revokeJWT(userId: string, token?: string) {
  if (token) await redis.srem(REFRESH_KEY(userId), hash(token));
  else await redis.del(REFRESH_KEY(userId));
}
