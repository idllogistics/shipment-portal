import { NextResponse } from "next/server";
import { getAuthedCustomerId } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";

export async function requireCustomer() {
  const customerId = await getAuthedCustomerId();
  if (!customerId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || !customer.active) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { customer };
}
