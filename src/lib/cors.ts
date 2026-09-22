import { NextResponse } from "next/server";

// The driver mobile app (Capacitor, a different origin: capacitor:// on iOS,
// http(s)://localhost on Android) calls these endpoints directly, so they
// need CORS enabled. There's no cookie-based session on this path — the
// access code in the URL is the only credential — so allowing any origin
// doesn't expose anything a bearer-token API wouldn't already expose.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function withCors(res: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
