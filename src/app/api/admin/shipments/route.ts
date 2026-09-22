import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { generateTrackingNumber } from "@/lib/tracking";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const shipments = await prisma.shipment.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });

  return NextResponse.json({ shipments });
}

const createSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  origin: z.string().trim().max(200).optional().or(z.literal("")),
  destination: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
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
  const { customerName, customerEmail, origin, destination, notes } =
    parsed.data;

  let trackingNumber = generateTrackingNumber();
  for (let attempts = 0; attempts < 5; attempts++) {
    const existing = await prisma.shipment.findUnique({
      where: { trackingNumber },
    });
    if (!existing) break;
    trackingNumber = generateTrackingNumber();
  }

  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber,
      customerName,
      customerEmail: customerEmail || null,
      origin: origin || null,
      destination: destination || null,
      notes: notes || null,
      events: { create: { status: "PENDING" } },
    },
  });

  return NextResponse.json({ shipment }, { status: 201 });
}
