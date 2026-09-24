import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/resetToken";

// Issues a fresh one-time link (the token is only returned here, never
// stored in readable form) and marks any pending "forgot password" request
// as handled. Staff send the link to the customer themselves.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { token, tokenHash } = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { customerId: id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({ data: { customerId: id, tokenHash, expiresAt } }),
    prisma.passwordResetRequest.updateMany({
      where: { customerId: id, resolvedAt: null },
      data: { resolvedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ token, expiresAt });
}
