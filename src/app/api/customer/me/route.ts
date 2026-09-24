import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customerGuard";

export async function GET() {
  const { customer, error } = await requireCustomer();
  if (error) return error;

  const [shipments, orderRequests] = await Promise.all([
    prisma.shipment.findMany({
      where: { customerId: customer.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        trackingNumber: true,
        origin: true,
        destination: true,
        status: true,
        cancelReason: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.orderRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    customer: { id: customer.id, name: customer.name, email: customer.email },
    shipments,
    orderRequests,
  });
}
