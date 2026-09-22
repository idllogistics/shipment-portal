import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withCors, corsPreflight } from "@/lib/cors";

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
});

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accessCode: string }> }
) {
  const { accessCode } = await params;

  const driver = await prisma.driver.findUnique({ where: { accessCode } });
  if (!driver) {
    return withCors(NextResponse.json({ error: "Driver not found" }, { status: 404 }));
  }
  if (!driver.active) {
    return withCors(NextResponse.json({ error: "Driver is inactive" }, { status: 403 }));
  }

  const body = await req.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid location" },
        { status: 400 }
      )
    );
  }

  const { lat, lng, accuracy } = parsed.data;

  await prisma.driver.update({
    where: { id: driver.id },
    data: {
      lastLat: lat,
      lastLng: lng,
      lastAccuracy: accuracy ?? null,
      lastLocationAt: new Date(),
    },
  });

  return withCors(NextResponse.json({ ok: true }));
}
