import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customerGuard";

const orderSchema = z.object({
  origin: z.string().trim().min(1, "Origin is required").max(200),
  destination: z.string().trim().min(1, "Destination is required").max(200),
  itemDescription: z.string().trim().max(1000).optional().or(z.literal("")),
  itemQuantity: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const { customer, error } = await requireCustomer();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { origin, destination, itemDescription, itemQuantity, notes } = parsed.data;

  const orderRequest = await prisma.orderRequest.create({
    data: {
      customerId: customer.id,
      origin,
      destination,
      itemDescription: itemDescription || null,
      itemQuantity: itemQuantity || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ orderRequest }, { status: 201 });
}
