import { pgSchema } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const auth = pgSchema("auth");

export const users = auth.table("users", (c) => ({
  id: c.varchar().primaryKey().$defaultFn(nanoid),
  email: c.varchar().notNull().unique(),
  userAgent: c.varchar().notNull().default("unknown"),
  ipAddress: c.varchar(),
  createdAt: c
    .timestamp({ withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: c
    .timestamp({ withTimezone: true, mode: "date" })
    .$onUpdateFn(() => new Date()),
}));
