import z from "zod";

export namespace JwtModel {
  export const payload = z.object({ sub: z.string() });
  export type Payload = z.infer<typeof payload>;

  export const refresh = z.object({ token: z.string().trim() });
  export type Refresh = z.infer<typeof refresh>;
}
