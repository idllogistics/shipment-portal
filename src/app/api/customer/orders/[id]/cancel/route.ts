import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customerGuard";

const schema = z.object({
  reason: z.string().trim().min(1, "Please tell us why you're cancelling").max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { customer, error } = await requireCustomer();
  if (error) return error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const orderRequest = await prisma.orderRequest.findUnique({ where: { id } });
  if (!orderRequest || orderRequest.customerId !== customer.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (orderRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only requests still awaiting review can be cancelled here" },
      { status: 400 }
    );
  }

  const updated = await prisma.orderRequest.update({
    where: { id },
    data: { status: "CANCELLED", cancelReason: parsed.data.reason, reviewedAt: new Date() },
  });
  return NextResponse.json({ orderRequest: updated });
}
