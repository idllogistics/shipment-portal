import type { ShipmentStatus, CheckpointType, ApproverRole } from "@prisma/client";

// A shipment can only take one checkpoint at a time: PICKUP while it hasn't
// been picked up yet, DELIVERY once it's on its way. This is what makes
// status "automatic" — the driver doesn't pick a status, completing the
// right checkpoint for where the shipment currently is IS the status change.
export function nextCheckpointType(status: ShipmentStatus): CheckpointType | null {
  if (status === "PENDING") return "PICKUP";
  if (status === "PICKED_UP" || status === "IN_TRANSIT" || status === "OUT_FOR_DELIVERY") {
    return "DELIVERY";
  }
  return null; // DELIVERED or EXCEPTION — no further checkpoint possible
}

export function statusAfterCheckpoint(type: CheckpointType): ShipmentStatus {
  return type === "PICKUP" ? "IN_TRANSIT" : "DELIVERED";
}

export function approverRoleForCheckpoint(type: CheckpointType): ApproverRole {
  return type === "PICKUP" ? "SENDER" : "RECEIVER";
}

export const CHECKPOINT_LABELS: Record<CheckpointType, string> = {
  PICKUP: "Pickup",
  DELIVERY: "Delivery",
};

export const APPROVER_ROLE_LABELS: Record<ApproverRole, string> = {
  SENDER: "Sender",
  RECEIVER: "Receiver",
};
