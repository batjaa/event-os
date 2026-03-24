import { createHash, randomBytes, timingSafeEqual } from "crypto";

export async function hash(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hashed = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return `${salt}:${hashed}`;
}

export async function compare(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hashed] = stored.split(":");
  if (!salt || !hashed) return false;
  const attempt = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hashed), Buffer.from(attempt));
  } catch {
    return false;
  }
}
