import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { generateDriverAccessCode } from "@/lib/tracking";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { shipments: true } } },
  });

  return NextResponse.json({ drivers });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
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

  let accessCode = generateDriverAccessCode();
  for (let attempts = 0; attempts < 5; attempts++) {
    const existing = await prisma.driver.findUnique({ where: { accessCode } });
    if (!existing) break;
    accessCode = generateDriverAccessCode();
  }

  const driver = await prisma.driver.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      accessCode,
    },
  });

  return NextResponse.json({ driver }, { status: 201 });
}
