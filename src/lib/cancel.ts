import type { CancelledBy } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function cancelShipment(shipmentId: string, reason: string, by: CancelledBy) {
  const [shipment] = await prisma.$transaction([
    prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        cancelledBy: by,
        cancelledAt: new Date(),
        events: {
          create: {
            status: "CANCELLED",
            message: `Cancelled by ${by === "CUSTOMER" ? "customer" : "staff"}: ${reason}`,
          },
        },
      },
    }),
    // Cancelling makes any open cancellation request moot.
    prisma.cancellationRequest.updateMany({
      where: { shipmentId, status: "PENDING" },
      data: { status: "APPROVED", reviewedAt: new Date() },
    }),
  ]);
  return shipment;
}
