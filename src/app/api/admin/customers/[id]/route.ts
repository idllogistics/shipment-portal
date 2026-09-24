import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { generateTempPassword, hashPassword } from "@/lib/password";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
      shipments: { orderBy: { updatedAt: "desc" } },
      orderRequests: { orderBy: { createdAt: "desc" } },
      passwordResetRequests: { where: { resolvedAt: null }, select: { createdAt: true } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

const updateSchema = z.object({
  active: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let tempPassword: string | undefined;
  const data: { active?: boolean; passwordHash?: string } = {};
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.resetPassword) {
    tempPassword = generateTempPassword();
    data.passwordHash = await hashPassword(tempPassword);
  }

  if (parsed.data.resetPassword) {
    await prisma.passwordResetRequest.updateMany({
      where: { customerId: id, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });
  }

  const updated = await prisma.customer.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, active: true, createdAt: true },
  });

  return NextResponse.json({ customer: updated, tempPassword });
}
