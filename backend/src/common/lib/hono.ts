import { Hono } from "hono";

export function router() {
  return new Hono();
}
