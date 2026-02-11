import * as model from "drizzle-zod";
import { schema } from "src/db";
import z from "zod";

export default class TasksModel {
  static base = model.createSelectSchema(schema.tasks);

  static create = model
    .createInsertSchema(schema.tasks, { content: z.string().trim() })
    .omit({
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    });
}

export type TTask = z.infer<typeof TasksModel.base>;
export type TTaskCreateInput = z.infer<typeof TasksModel.create>;
