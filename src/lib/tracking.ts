const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function generateTrackingNumber() {
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `SHP-${code}`;
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
};

export const STATUS_ORDER = [
  "PENDING",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;
