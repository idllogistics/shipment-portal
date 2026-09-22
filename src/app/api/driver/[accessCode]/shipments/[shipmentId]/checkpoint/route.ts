import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors, corsPreflight } from "@/lib/cors";
import { saveShipmentPhoto, saveShipmentSignature, UploadError } from "@/lib/uploads";
import {
  nextCheckpointType,
  statusAfterCheckpoint,
  approverRoleForCheckpoint,
  CHECKPOINT_LABELS,
} from "@/lib/checkpoints";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accessCode: string; shipmentId: string }> }
) {
  const { accessCode, shipmentId } = await params;

  const driver = await prisma.driver.findUnique({ where: { accessCode } });
  if (!driver) {
    return withCors(NextResponse.json({ error: "Driver not found" }, { status: 404 }));
  }
  if (!driver.active) {
    return withCors(NextResponse.json({ error: "Driver is inactive" }, { status: 403 }));
  }

  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment || shipment.driverId !== driver.id) {
    return withCors(NextResponse.json({ error: "Shipment not found" }, { status: 404 }));
  }

  const type = nextCheckpointType(shipment.status);
  if (!type) {
    return withCors(
      NextResponse.json(
        { error: "This shipment doesn't have a pickup or delivery step pending." },
        { status: 400 }
      )
    );
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return withCors(NextResponse.json({ error: "Invalid form data" }, { status: 400 }));
  }

  const condition = formData.get("condition");
  const conditionNotes = formData.get("conditionNotes");
  const approverName = formData.get("approverName");
  const signatureFile = formData.get("signature");
  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);

  if (condition !== "GOOD" && condition !== "DAMAGED") {
    return withCors(
      NextResponse.json({ error: "Condition must be GOOD or DAMAGED" }, { status: 400 })
    );
  }
  if (typeof approverName !== "string" || !approverName.trim()) {
    return withCors(
      NextResponse.json(
        { error: `The ${type === "PICKUP" ? "sender's" : "receiver's"} name is required` },
        { status: 400 }
      )
    );
  }
  if (!(signatureFile instanceof File) || signatureFile.size === 0) {
    return withCors(NextResponse.json({ error: "A signature is required" }, { status: 400 }));
  }
  if (photoFiles.length === 0) {
    return withCors(
      NextResponse.json({ error: "At least one photo is required" }, { status: 400 })
    );
  }

  try {
    const signatureUrl = await saveShipmentSignature(shipment.trackingNumber, signatureFile);
    const photoUrls = await Promise.all(
      photoFiles.map((f) => saveShipmentPhoto(shipment.trackingNumber, f))
    );

    const newStatus = statusAfterCheckpoint(type);
    const approverRole = approverRoleForCheckpoint(type);

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: newStatus,
        checkpoints: {
          create: {
            type,
            condition,
            conditionNotes: typeof conditionNotes === "string" ? conditionNotes || null : null,
            approverName: approverName.trim(),
            approverRole,
            signatureUrl,
            photos: { create: photoUrls.map((url) => ({ shipmentId: shipment.id, url })) },
          },
        },
        events: {
          create: {
            status: newStatus,
            message: `${CHECKPOINT_LABELS[type]} confirmed — condition: ${
              condition === "GOOD" ? "Good" : "Damaged"
            } — approved by ${approverName.trim()} (${approverRole === "SENDER" ? "Sender" : "Receiver"})`,
          },
        },
      },
      include: {
        photos: { where: { checkpointId: null }, orderBy: { createdAt: "desc" } },
        events: { orderBy: { createdAt: "desc" } },
        checkpoints: {
          orderBy: { createdAt: "desc" },
          include: { photos: true },
        },
      },
    });

    return withCors(NextResponse.json({ shipment: updated }, { status: 201 }));
  } catch (err) {
    if (err instanceof UploadError) {
      return withCors(NextResponse.json({ error: err.message }, { status: 400 }));
    }
    throw err;
  }
}
