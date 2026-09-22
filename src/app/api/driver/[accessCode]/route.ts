import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ accessCode: string }> }
) {
  const { accessCode } = await params;

  const driver = await prisma.driver.findUnique({
    where: { accessCode },
    include: {
      shipments: {
        where: { status: { in: ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          trackingNumber: true,
          customerName: true,
          destination: true,
          status: true,
        },
      },
    },
  });

  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  return NextResponse.json({
    driver: {
      id: driver.id,
      name: driver.name,
      active: driver.active,
      lastLocationAt: driver.lastLocationAt,
      shipments: driver.shipments,
    },
  });
}
