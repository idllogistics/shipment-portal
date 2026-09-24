import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customerGuard";
import { hashPassword, verifyPassword } from "@/lib/password";

const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200),
});

export async function POST(req: NextRequest) {
  const { customer, error } = await requireCustomer();
  if (error) return error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  if (!(await verifyPassword(parsed.data.currentPassword, customer.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  return NextResponse.json({ ok: true });
}
