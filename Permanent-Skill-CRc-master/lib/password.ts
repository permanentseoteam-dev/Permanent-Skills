import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const KEY = "permanent-skill-strategy-local";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", KEY).update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const supplied = createHmac("sha256", KEY).update(`${salt}:${password}`).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(supplied);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
