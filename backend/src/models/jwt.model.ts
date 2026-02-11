import z from "zod";

export default class JwtModel {
  static payload = z.object({
    sub: z.string(),
  });

  static refresh = z.object({
    refreshToken: z.string().trim(),
  });
}

export type TJwtPayload = z.infer<typeof JwtModel.payload>;
export type TJwtRefresh = z.infer<typeof JwtModel.refresh>;
