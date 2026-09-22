import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  const { trackingNumber } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: trackingNumber.toUpperCase() },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  return NextResponse.json({ shipment });
}
