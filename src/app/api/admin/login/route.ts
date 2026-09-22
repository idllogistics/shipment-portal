import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/lib/auth";

function safeCompare(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Server is not configured (ADMIN_PASSWORD missing)" },
      { status: 500 }
    );
  }

  if (!safeCompare(password, expected)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
