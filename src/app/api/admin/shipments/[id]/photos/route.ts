import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { saveShipmentPhoto, deleteShipmentPhoto, UploadError } from "@/lib/uploads";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File);
  const caption = formData.get("caption");

  if (files.length === 0) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  }

  try {
    const created = [];
    for (const file of files) {
      const url = await saveShipmentPhoto(shipment.trackingNumber, file);
      const photo = await prisma.photo.create({
        data: {
          shipmentId: shipment.id,
          url,
          caption: typeof caption === "string" && caption ? caption : null,
        },
      });
      created.push(photo);
    }
    await prisma.shipment.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json({ photos: created }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const photoId = req.nextUrl.searchParams.get("photoId");
  if (!photoId) {
    return NextResponse.json({ error: "photoId is required" }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo || photo.shipmentId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.photo.delete({ where: { id: photoId } });
  await deleteShipmentPhoto(photo.url);
  return NextResponse.json({ ok: true });
}
