import z from "zod";

export default class MagicLinkModel {
  static intent = z.object({
    email: z.email().trim(),
  });

  static callback = z.object({
    token: z.string().trim(),
  });

  static payload = z.object({
    email: z.email().trim(),
    uaHash: z.string().trim(),
    ipHash: z.string().optional(),
  });

  static generate = z.object({
    email: z.email().trim(),
    userAgent: z.string().trim(),
    ipAddress: z.string().trim().optional(),
  });

  static consume = z.object({
    token: z.string().trim(),
    userAgent: z.string().trim(),
    ipAddress: z.string().trim().optional(),
  });
}

export type TMagicLinkIntent = z.infer<typeof MagicLinkModel.intent>;
export type TMagicLinkCallback = z.infer<typeof MagicLinkModel.callback>;
export type TMagicLinkPayload = z.infer<typeof MagicLinkModel.payload>;
export type TMagicLinkGenerate = z.infer<typeof MagicLinkModel.generate>;
export type TMagicLinkConsume = z.infer<typeof MagicLinkModel.consume>;
