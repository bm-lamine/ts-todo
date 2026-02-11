import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { TTL } from "src/helpers/constants";
import forget from "src/helpers/promise-forget";
import STATUS_CODE from "src/helpers/status-code";
import MagicLinkModel, {
  type TMagicLinkConsume,
  type TMagicLinkGenerate,
  type TMagicLinkPayload,
} from "src/models/magic-link.model";
import CacheService, { redis } from "src/services/cache.service";
import HashService from "src/services/hash.service";

export default class MagicLinkService {
  static INTENT_HASH_KEY = (tokenHash: string) =>
    `magic-link:intent:${tokenHash}`;
  static INTENT_HASH_TTL = TTL["15m"];

  static async generate(options: TMagicLinkGenerate): Promise<string> {
    const token = nanoid(128);
    const json = JSON.stringify({
      email: options.email,
      uaHash: HashService.hash(options.userAgent),
      ipHash: options.ipAddress
        ? HashService.hash(options.ipAddress)
        : undefined,
    } satisfies TMagicLinkPayload);

    forget(
      redis.setex(
        this.INTENT_HASH_KEY(HashService.hash(token)),
        this.INTENT_HASH_TTL,
        json,
      ),
    );

    return token;
  }

  static async consume(options: TMagicLinkConsume): Promise<string> {
    const key = this.INTENT_HASH_KEY(HashService.hash(options.token));
    const data = await CacheService.get(key, MagicLinkModel.payload, true);

    if (
      !data ||
      !HashService.compare(data.uaHash, HashService.hash(options.userAgent))
    ) {
      throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
        message: "Invalid payload",
      });
    }

    return data.email;
  }
}
