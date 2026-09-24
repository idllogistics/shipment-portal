import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { hashResetToken } from "@/lib/resetToken";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(parsed.data.token) },
    include: { customer: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date() || !record.customer.active) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Ask us for a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.customer.update({ where: { id: record.customerId }, data: { passwordHash } }),
    prisma.passwordResetToken.updateMany({
      where: { customerId: record.customerId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
