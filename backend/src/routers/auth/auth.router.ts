import { Hono } from "hono";
import { getConnInfo } from "hono/bun";
import type { JwtVariables } from "hono/jwt";
import { env } from "src/config/env";
import STATUS_CODE from "src/helpers/status-code";
import parser from "src/middlewares/request-parser";
import requireJwt from "src/middlewares/require-jwt";
import JwtModel, { type TJwtPayload } from "src/models/jwt.model";
import MagicLinkModel from "src/models/magic-link.model";
import UsersRepo from "src/repo/users.repo";
import ErrorFactory from "src/services/error.service";
import JwtService from "src/services/jwt.service";
import MagicLinkService from "src/services/magic-link.service";

const auth = new Hono();

auth.route(
  "/magic-link",
  new Hono()
    .post(
      "/intent",
      parser("json", MagicLinkModel.intent),
      async function (ctx) {
        const token = await MagicLinkService.generate({
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

        const email = await MagicLinkService.consume({
          token,
          userAgent,
          ipAddress,
        });

        const user = await UsersRepo.findOrCreate({
          email,
          userAgent,
          ipAddress,
        });

        if (!user) {
          return ctx.json(
            ErrorFactory.single("Failed to create user"),
            STATUS_CODE.INTERNAL_SERVER_ERROR,
          );
        }

        return ctx.json({
          tokens: await JwtService.authenticate(user.id),
          message: "user created successfully",
        });
      },
    ),
);

auth.route(
  "/tokens",
  new Hono<{ Variables: JwtVariables<TJwtPayload> }>()
    .post("/refresh", parser("json", JwtModel.refresh), async function (ctx) {
      const { refreshToken: incomingToken } = ctx.req.valid("json");
      const { accessToken, refreshToken } =
        await JwtService.refresh(incomingToken);
      return ctx.json({ accessToken, refreshToken });
    })
    .post(
      "/revoke",
      requireJwt,
      parser("json", JwtModel.refresh),
      async function (ctx) {
        const { sub } = ctx.get("jwtPayload");
        const { refreshToken } = ctx.req.valid("json");
        await JwtService.revoke(sub, refreshToken);
        return ctx.json({ success: true });
      },
    ),
);

export default auth;
