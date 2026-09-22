import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createSessionToken(customerId: string) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${customerId}.${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [customerId, expiresStr, signature] = parts;
  const payload = `${customerId}.${expiresStr}`;
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  return customerId || null;
}

export async function setCustomerSessionCookie(customerId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(customerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearCustomerSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAuthedCustomerId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}
