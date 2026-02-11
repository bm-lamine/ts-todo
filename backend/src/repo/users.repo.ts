import { eq } from "drizzle-orm";
import { db, schema } from "src/db";
import { TTL } from "src/helpers/constants";
import forget from "src/helpers/promise-forget";
import type { TUser, TUserCreateInput } from "src/models/users.model";
import UsersModel from "src/models/users.model";
import CacheService, { redis } from "src/services/cache.service";

export default class UsersRepo {
  static USERS_KEY = "users";
  static USERS_TTL = TTL["2h"];

  static USER_EMAIL_KEY = (email: string) => `user:email:${email}`;
  static USER_EMAIL_TTL = TTL["2h"];

  static USER_ID_KEY = (id: string) => `user:id:${id}`;
  static USER_ID_TTL = TTL["2h"];

  static query = db.select().from(schema.users).$dynamic();

  static async findByEmail(email: string) {
    const key = this.USER_EMAIL_KEY(email);
    const cached = await CacheService.get(key, UsersModel.base);
    if (cached) return cached;

    const [result] = await this.query
      .where(eq(schema.users.email, email))
      .limit(1);

    return result ?? null;
  }

  static async findById(id: string) {
    const key = this.USER_ID_KEY(id);
    const cached = await CacheService.get(key, UsersModel.base);
    if (cached) return cached;

    const [result] = await this.query.where(eq(schema.users.id, id)).limit(1);
    return result ?? null;
  }

  static async create(data: TUserCreateInput) {
    const [result] = await db.insert(schema.users).values(data).returning();
    if (result) forget(this.cache(result));
    return result;
  }

  static async cache(user: TUser) {
    const json = JSON.stringify(user);
    await redis
      .multi()
      .setex(this.USER_EMAIL_KEY(user.email), this.USER_EMAIL_TTL, json)
      .setex(this.USER_ID_KEY(user.id), this.USER_ID_TTL, json)
      .del(this.USERS_KEY)
      .exec();
  }

  static async findOrCreate(data: TUserCreateInput) {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) return existingUser;
    return await this.create(data);
  }
}
