import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LOCATION_VISIBLE_STATUSES = new Set([
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
]);

// Treat a driver ping as stale (driver likely went off duty) past this age.
const MAX_LOCATION_AGE_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  const { trackingNumber } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: trackingNumber.toUpperCase() },
    include: {
      photos: { where: { checkpointId: null }, orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
      driver: true,
      checkpoints: {
        orderBy: { createdAt: "desc" },
        include: { photos: true },
      },
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  const { driver } = shipment;

  let driverLocation: {
    lat: number;
    lng: number;
    accuracy: number | null;
    updatedAt: string;
  } | null = null;

  if (
    driver &&
    driver.lastLat != null &&
    driver.lastLng != null &&
    driver.lastLocationAt &&
    LOCATION_VISIBLE_STATUSES.has(shipment.status) &&
    Date.now() - driver.lastLocationAt.getTime() < MAX_LOCATION_AGE_MS
  ) {
    driverLocation = {
      lat: driver.lastLat,
      lng: driver.lastLng,
      accuracy: driver.lastAccuracy,
      updatedAt: driver.lastLocationAt.toISOString(),
    };
  }

  // Explicit whitelist for this public endpoint — declaredValue/currency and
  // raw documents are commercial/customs paperwork, kept admin-only.
  const publicShipment = {
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    customerName: shipment.customerName,
    origin: shipment.origin,
    destination: shipment.destination,
    status: shipment.status,
    notes: shipment.notes,
    itemDescription: shipment.itemDescription,
    itemQuantity: shipment.itemQuantity,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    photos: shipment.photos,
    events: shipment.events,
    checkpoints: shipment.checkpoints.map((c) => ({
      id: c.id,
      type: c.type,
      condition: c.condition,
      conditionNotes: c.conditionNotes,
      approverName: c.approverName,
      approverRole: c.approverRole,
      signatureUrl: c.signatureUrl,
      photos: c.photos,
      createdAt: c.createdAt,
    })),
    driverLocation,
  };

  return NextResponse.json({ shipment: publicShipment });
}
