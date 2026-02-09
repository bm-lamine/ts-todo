import { Hono } from "hono";
import { getConnInfo } from "hono/bun";
import type { JwtVariables } from "hono/jwt";
import { env } from "src/config/env";
import ErrorFactory from "src/helpers/error-factory";
import STATUS_CODE from "src/helpers/status-code";
import { parser } from "src/middlewares/request-parser";
import { requireJwt } from "src/middlewares/require.jwt";
import { MagicLinkModel } from "src/models/auth.model";
import { JwtModel } from "src/models/jwt.model";
import { findOrCreateUser } from "src/repo/users";
import { authenticate, refreshAuth, revokeJWT } from "src/services/jwt";
import { consumeMagicLink, generateMagicLink } from "src/services/magic-link";

export const auth = new Hono();

auth.route(
  "/magic-link",
  new Hono()
    .post(
      "/intent",
      parser("json", MagicLinkModel.intent),
      async function (ctx) {
        const token = await generateMagicLink({
          email: ctx.req.valid("json").email,
          userAgent: ctx.req.header("User-Agent") ?? "unknown",
        });

        return ctx.json({
          message:
            env.NODE_ENV === "production"
              ? "your email was registered, please check your inbox"
              : `your token is ${token}`,
        });
      },
    )
    .post(
      "/callback",
      parser("query", MagicLinkModel.callback),
      async function (ctx) {
        const { token } = ctx.req.valid("query");
        const userAgent = ctx.req.header("User-Agent") ?? "unknown";
        const ipAddress = getConnInfo(ctx).remote.address;

        const email = await consumeMagicLink({ token, userAgent, ipAddress });
        const user = await findOrCreateUser({ email, userAgent, ipAddress });

        if (!user) {
          return ctx.json(
            ErrorFactory.single("Failed to create user"),
            STATUS_CODE.INTERNAL_SERVER_ERROR,
          );
        }

        return ctx.json({
          tokens: await authenticate(user.id),
          message: "user created successfully",
        });
      },
    ),
);

auth.route(
  "/tokens",
  new Hono<{ Variables: JwtVariables<JwtModel.Payload> }>()
    .post("/refresh", parser("json", JwtModel.refresh), async function (ctx) {
      const { token: incomingToken } = ctx.req.valid("json");
      const { accessToken, refreshToken } = await refreshAuth(incomingToken);
      return ctx.json({ accessToken, refreshToken });
    })
    .post(
      "/revoke",
      requireJwt,
      parser("json", JwtModel.refresh),
      async function (ctx) {
        const { sub } = ctx.get("jwtPayload");
        await revokeJWT(sub, ctx.req.valid("json").token);
        return ctx.json({ success: true });
      },
    ),
);
