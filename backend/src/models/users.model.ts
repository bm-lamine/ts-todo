import * as model from "drizzle-zod";
import { schema } from "src/db";
import z from "zod";

export default class UsersModel {
  static base = model.createSelectSchema(schema.users);
  static create = model
    .createInsertSchema(schema.users, { email: z.email() })
    .omit({ id: true, createdAt: true, updatedAt: true });
}

export type TUser = z.infer<typeof UsersModel.base>;
export type TUserCreateInput = z.infer<typeof UsersModel.create>;
