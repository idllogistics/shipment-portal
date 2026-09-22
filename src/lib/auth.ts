import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken() {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresStr, signature] = parts;
  const payload = `${role}.${expiresStr}`;
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  return role === "admin";
}

export async function setAdminSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdminAuthed() {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
