import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { generateTempPassword, hashPassword } from "@/lib/password";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { shipments: true, orderRequests: true } } },
  });

  return NextResponse.json({ customers });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
});

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A customer with that email already exists" },
      { status: 400 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const customer = await prisma.customer.create({
    data: { name: parsed.data.name, email, passwordHash },
  });

  return NextResponse.json(
    { customer, tempPassword },
    { status: 201 }
  );
}
