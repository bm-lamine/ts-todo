import { eq } from "drizzle-orm";
import { db, schema } from "src/db";
import type { UserModel } from "src/models/user.model";

const select = db.select().from(schema.users).$dynamic();

export async function findUserByEmail(email: string) {
  const result = await select.where(eq(schema.users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function createUser(data: UserModel.Create) {
  const result = await db.insert(schema.users).values(data).returning();
  return result[0] ?? null;
}

export async function findOrCreateUser(data: UserModel.Create) {
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) return existingUser;
  return await createUser(data);
}
