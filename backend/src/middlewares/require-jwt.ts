import { jwt } from "hono/jwt";
import { env } from "src/config/env";

export const requireJwt = jwt({
  secret: env.JWT_SECRET,
  alg: "HS256",
});
