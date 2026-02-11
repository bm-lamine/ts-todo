import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import STATUS_CODE from "src/helpers/status-code";
import ErrorService from "src/services/error.service";
import type { ZodType } from "zod";

export default function parser<
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(target: Target, schema: T) {
  return zValidator(target, schema, (result, ctx) => {
    if (!result.success) {
      return ctx.json(
        ErrorService.from(result.error.issues).toJSON(),
        STATUS_CODE.UNPROCESSABLE_ENTITY,
      );
    }
  });
}
