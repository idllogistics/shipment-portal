import type { CancelledBy } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function cancelShipment(shipmentId: string, reason: string, by: CancelledBy) {
  return prisma.shipment.update({
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
  });
}
