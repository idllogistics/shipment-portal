import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { cancelShipment } from "@/lib/cancel";

const schema = z.object({
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (shipment.status === "DELIVERED" || shipment.status === "CANCELLED") {
    return NextResponse.json(
      { error: `A ${shipment.status.toLowerCase()} shipment can't be cancelled` },
      { status: 400 }
    );
  }

  const updated = await cancelShipment(id, parsed.data.reason, "ADMIN");
  return NextResponse.json({ shipment: updated });
}
