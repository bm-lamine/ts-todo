import { foreignKey, pgSchema } from "drizzle-orm/pg-core";
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

export const tma = pgSchema("tma"); //* Task Management App

export const TASK_STATUS = tma.enum("task_status", ["TODO", "DOING", "DONE"]);

export const tasks = tma.table(
  "tasks",
  (c) => ({
    id: c.varchar().primaryKey().$defaultFn(nanoid),
    content: c.text().notNull(),
    status: TASK_STATUS().notNull().default("TODO"),
    createdAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$onUpdateFn(() => new Date()),
    userId: c.varchar().notNull(),
  }),
  (t) => [foreignKey({ columns: [t.userId], foreignColumns: [users.id] })],
);
