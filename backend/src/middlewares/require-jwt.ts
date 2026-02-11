import { jwt } from "hono/jwt";
import { env } from "src/config/env";

const requireJwt = jwt({
  secret: env.JWT_SECRET,
  alg: "HS256",
});

export default requireJwt;
