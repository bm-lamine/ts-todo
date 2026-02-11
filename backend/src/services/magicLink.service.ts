import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { hash, safeCompare } from "src/helpers/crypto-hash";
import forget from "src/helpers/promise-forget";
import STATUS_CODE from "src/helpers/status-code";
import { MagicLinkModel } from "src/models/auth.model";
import redis from "src/redis";
import { TTL } from "src/redis/constants";
import CacheService from "src/services/cache.service";

export default class MagicLinkService {
  static INTENT_HASH_KEY = (tokenHash: string) =>
    `magic-link:intent:${tokenHash}`;
  static INTENT_HASH_TTL = TTL["15m"];

  static async generate(options: MagicLinkModel.Generate): Promise<string> {
    const token = nanoid(128);
    const json = JSON.stringify({
      email: options.email,
      uaHash: hash(options.userAgent),
      ipHash: options.ipAddress ? hash(options.ipAddress) : undefined,
    } satisfies MagicLinkModel.Payload);

    forget(
      redis.setex(
        this.INTENT_HASH_KEY(hash(token)),
        this.INTENT_HASH_TTL,
        json,
      ),
    );

    return token;
  }

  static async consume(options: MagicLinkModel.Consume): Promise<string> {
    const key = this.INTENT_HASH_KEY(hash(options.token));
    const data = await CacheService.get(
      { key, schema: MagicLinkModel.payload },
      true,
    );

    if (!data || !safeCompare(data.uaHash, hash(options.userAgent))) {
      throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
        message: "Invalid payload",
      });
    }

    return data.email;
  }
}
