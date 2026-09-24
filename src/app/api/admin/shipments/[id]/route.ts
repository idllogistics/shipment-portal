import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      photos: { where: { checkpointId: null }, orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
      driver: true,
      documents: { orderBy: { createdAt: "desc" } },
      checkpoints: {
        orderBy: { createdAt: "desc" },
        include: { photos: true },
      },
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ shipment });
}

const updateSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "EXCEPTION",
    ])
    .optional(),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  origin: z.string().trim().max(200).optional().or(z.literal("")),
  destination: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  driverId: z.string().trim().nullable().optional(),
  itemDescription: z.string().trim().max(1000).optional().or(z.literal("")),
  itemQuantity: z.string().trim().max(200).optional().or(z.literal("")),
  declaredValue: z.number().nonnegative().nullable().optional(),
  declaredValueCurrency: z.string().trim().max(10).optional().or(z.literal("")),
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

  const existing = await prisma.shipment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const {
    status,
    message,
    origin,
    destination,
    notes,
    driverId,
    itemDescription,
    itemQuantity,
    declaredValue,
    declaredValueCurrency,
  } = parsed.data;

  if (driverId) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 400 });
    }
  }

  const shipment = await prisma.shipment.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(status && existing.status === "CANCELLED"
        ? { cancelReason: null, cancelledBy: null, cancelledAt: null }
        : {}),
      ...(origin !== undefined ? { origin: origin || null } : {}),
      ...(destination !== undefined
        ? { destination: destination || null }
        : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(driverId !== undefined ? { driverId: driverId || null } : {}),
      ...(itemDescription !== undefined
        ? { itemDescription: itemDescription || null }
        : {}),
      ...(itemQuantity !== undefined ? { itemQuantity: itemQuantity || null } : {}),
      ...(declaredValue !== undefined ? { declaredValue } : {}),
      ...(declaredValueCurrency !== undefined
        ? { declaredValueCurrency: declaredValueCurrency || null }
        : {}),
      ...(status
        ? {
            events: {
              create: { status, message: message || null },
            },
          }
        : {}),
    },
    include: {
      photos: { where: { checkpointId: null }, orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
      driver: true,
      documents: { orderBy: { createdAt: "desc" } },
      checkpoints: {
        orderBy: { createdAt: "desc" },
        include: { photos: true },
      },
    },
  });

  return NextResponse.json({ shipment });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await prisma.shipment.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
