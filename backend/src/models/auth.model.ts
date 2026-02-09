import z from "zod";

export namespace MagicLinkModel {
  export const intent = z.object({ email: z.email().trim() });
  export type Intent = z.infer<typeof intent>;

  export const callback = z.object({ token: z.string().trim() });
  export type Callback = z.infer<typeof callback>;

  export const payload = z.object({
    email: z.email().trim(),
    uaHash: z.string().trim(),
    ipHash: z.string().optional(),
  });
  export type Payload = z.infer<typeof payload>;

  export const generate = z.object({
    email: z.email().trim(),
    userAgent: z.string().trim(),
    ipAddress: z.string().trim().optional(),
  });
  export type Generate = z.infer<typeof generate>;

  export const consume = z.object({
    token: z.string().trim(),
    userAgent: z.string().trim(),
    ipAddress: z.string().trim().optional(),
  });
  export type Consume = z.infer<typeof consume>;
}
