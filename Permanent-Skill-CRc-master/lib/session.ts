import { createHmac, timingSafeEqual } from "crypto";
import type { User } from "./types";

const SECRET = process.env.AUTH_SECRET || "permanent-skill-strategy-session";

export function signPayload(data: unknown) {
  const body = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyPayload<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function nextPathFor(user: Pick<User, "role" | "status" | "application">) {
  if (user.role === "admin") return "/admin";
  return "/community";
}
