import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { hash, safeCompare } from "src/helpers/crypto-hash";
import { getCache } from "src/helpers/get-cache";
import forget from "src/helpers/promise-forget";
import STATUS_CODE from "src/helpers/status-code";
import { MagicLinkModel } from "src/models/auth.model";
import redis from "src/redis";
import { TTL } from "src/redis/constants";

export const INTENT_HASH_KEY = (tokenHash: string) =>
  `magic-link:intent:${tokenHash}`;
export const INTENT_HASH_TTL = TTL["15m"];

export async function generateMagicLink(
  options: MagicLinkModel.Generate,
): Promise<string> {
  const token = nanoid(128);
  const json = JSON.stringify({
    email: options.email,
    uaHash: hash(options.userAgent),
    ipHash: options.ipAddress ? hash(options.ipAddress) : undefined,
  } satisfies MagicLinkModel.Payload);

  forget(redis.setex(INTENT_HASH_KEY(hash(token)), INTENT_HASH_TTL, json));
  return token;
}

export async function consumeMagicLink(
  options: MagicLinkModel.Consume,
): Promise<string> {
  const data = await getCache(
    {
      key: INTENT_HASH_KEY(hash(options.token)),
      schema: MagicLinkModel.payload,
    },
    true,
  );

  if (!data || !safeCompare(data.uaHash, hash(options.userAgent))) {
    throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
      message: "Invalid payload",
    });
  }

  return data.email;
}
