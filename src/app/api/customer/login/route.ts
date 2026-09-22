import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setCustomerSessionCookie } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.active) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, customer.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  await setCustomerSessionCookie(customer.id);
  return NextResponse.json({ ok: true });
}
