import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { extractInvoiceFields } from "@/lib/ocr";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_BYTES = 15 * 1024 * 1024;

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
  const file = formData?.get("document");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No document provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WEBP, GIF, or PDF files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 15MB)." }, { status: 400 });
  }

  const safeTracking = shipment.trackingNumber.replace(/[^a-zA-Z0-9_-]/g, "");
  const ext = file.name.split(".").pop() || "bin";
  const pathname = `shipments/${safeTracking}/documents/${Date.now()}-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const blob = await put(pathname, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  const extracted = await extractInvoiceFields(buffer, file.type);

  const document = await prisma.shipmentDocument.create({
    data: {
      shipmentId: shipment.id,
      url: blob.url,
      filename: file.name,
      itemDescription: extracted.itemDescription,
      itemQuantity: extracted.itemQuantity,
      declaredValue: extracted.declaredValue,
      declaredValueCurrency: extracted.declaredValueCurrency,
      extractionError: extracted.error,
    },
  });

  const updatedShipment = await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      ...(extracted.itemDescription ? { itemDescription: extracted.itemDescription } : {}),
      ...(extracted.itemQuantity ? { itemQuantity: extracted.itemQuantity } : {}),
      ...(extracted.declaredValue != null ? { declaredValue: extracted.declaredValue } : {}),
      ...(extracted.declaredValueCurrency
        ? { declaredValueCurrency: extracted.declaredValueCurrency }
        : {}),
    },
  });

  return NextResponse.json({ document, shipment: updatedShipment }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const documentId = req.nextUrl.searchParams.get("documentId");
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const document = await prisma.shipmentDocument.findUnique({ where: { id: documentId } });
  if (!document || document.shipmentId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.shipmentDocument.delete({ where: { id: documentId } });
  await del(document.url).catch(() => null);
  return NextResponse.json({ ok: true });
}
