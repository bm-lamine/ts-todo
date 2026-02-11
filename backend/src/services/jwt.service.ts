import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { env } from "src/config/env";
import { hash } from "src/helpers/crypto-hash";
import STATUS_CODE from "src/helpers/status-code";
import { JwtModel } from "src/models/jwt.model";
import redis from "src/redis";
import { TTL } from "src/redis/constants";

export default class JwtService {
  static REFRESH_KEY = (userId: string) => `auth:refresh:${userId}`;
  static ACCESS_TTL = TTL["5m"];
  static REFRESH_TTL = TTL["7d"];

  static sign = async (payload: JwtModel.Payload, ttl: number) => {
    const now = Math.floor(Date.now() / 1000);
    return await jwt.sign(
      { ...payload, iat: now, exp: now + ttl },
      env.JWT_SECRET,
      "HS256",
    );
  };

  static verify = async function (token: string) {
    try {
      const payload = await jwt.verify(token, env.JWT_SECRET, "HS256");
      const parsed = JwtModel.payload.safeParse(payload);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  };

  static async authenticate(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.sign({ sub: userId }, this.ACCESS_TTL),
      this.sign({ sub: userId }, this.REFRESH_TTL),
    ]);

    await redis
      .multi()
      .sadd(this.REFRESH_KEY(userId), hash(refreshToken))
      .expire(this.REFRESH_KEY(userId), this.REFRESH_TTL, "NX")
      .exec();

    return { accessToken, refreshToken };
  }

  static async refresh(token: string) {
    const payload = await this.verify(token);
    if (!payload) {
      throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
        message: "invalid token issued",
      });
    }

    const exists = await redis.sismember(
      this.REFRESH_KEY(payload.sub),
      hash(token),
    );
    if (!exists) {
      throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
        message: "token reuse detected",
      });
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.sign({ sub: payload.sub }, this.ACCESS_TTL),
      this.sign({ sub: payload.sub }, this.REFRESH_TTL),
    ]);

    await redis
      .multi()
      .srem(this.REFRESH_KEY(payload.sub), hash(token))
      .sadd(this.REFRESH_KEY(payload.sub), hash(refreshToken))
      .expire(this.REFRESH_KEY(payload.sub), this.REFRESH_TTL, "NX")
      .exec();

    return { accessToken, refreshToken };
  }

  static async revoke(userId: string, token?: string) {
    if (token) await redis.srem(this.REFRESH_KEY(userId), hash(token));
    else await redis.del(this.REFRESH_KEY(userId));
  }
}
