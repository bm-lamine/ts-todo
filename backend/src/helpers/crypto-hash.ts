import crypto from "crypto";
import { env } from "src/config/env";

export const hash = function (plain: string) {
  return crypto
    .createHmac("sha256", env.HASH_SECRET)
    .update(plain)
    .digest("hex");
};

export const safeCompare = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return bufferA.length !== bufferB.length
    ? false
    : crypto.timingSafeEqual(bufferA, bufferB);
};
