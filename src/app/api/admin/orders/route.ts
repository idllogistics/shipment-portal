import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const orderRequests = await prisma.orderRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ orderRequests });
}
