import z from "zod";

export namespace JwtModel {
  export const payload = z.object({ sub: z.string() });
  export type Payload = z.infer<typeof payload>;
}
