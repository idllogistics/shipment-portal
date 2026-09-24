import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Always answers the same way so this can't be used to discover which
// emails have accounts. Only active (staff-approved) accounts get a request.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (email) {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (customer?.active) {
      const open = await prisma.passwordResetRequest.findFirst({
        where: { customerId: customer.id, resolvedAt: null },
      });
      if (!open) {
        await prisma.passwordResetRequest.create({ data: { customerId: customer.id } });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
