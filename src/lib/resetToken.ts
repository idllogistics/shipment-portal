import { createHash, randomBytes } from "crypto";

export const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generateResetToken() {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
