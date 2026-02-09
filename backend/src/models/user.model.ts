import * as model from "drizzle-zod";
import { schema } from "src/db";
import z from "zod";

export namespace UserModel {
  export const create = model
    .createInsertSchema(schema.users, { email: z.email() })
    .omit({ id: true, createdAt: true, updatedAt: true });

  export type Create = z.infer<typeof create>;
}
