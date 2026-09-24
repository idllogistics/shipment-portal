import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors, corsPreflight } from "@/lib/cors";
import { nextCheckpointType } from "@/lib/checkpoints";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ accessCode: string }> }
) {
  const { accessCode } = await params;

  const driver = await prisma.driver.findUnique({
    where: { accessCode },
    include: {
      shipments: {
        where: { status: { notIn: ["DELIVERED", "EXCEPTION", "CANCELLED"] } },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          trackingNumber: true,
          customerName: true,
          origin: true,
          destination: true,
          status: true,
        },
      },
    },
  });

  if (!driver) {
    return withCors(NextResponse.json({ error: "Driver not found" }, { status: 404 }));
  }

  return withCors(
    NextResponse.json({
      driver: {
        id: driver.id,
        name: driver.name,
        active: driver.active,
        lastLocationAt: driver.lastLocationAt,
        shipments: driver.shipments.map((s) => ({
          ...s,
          nextCheckpoint: nextCheckpointType(s.status),
        })),
      },
    })
  );
}
