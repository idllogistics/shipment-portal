import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export class UploadError extends Error {}

function extFromMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

export async function saveShipmentPhoto(trackingNumber: string, file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError("Only JPEG, PNG, WEBP, or GIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Image is too large (max 10MB).");
  }

  const safeTracking = trackingNumber.replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `${Date.now()}-${randomUUID()}.${extFromMime(file.type)}`;
  const pathname = `shipments/${safeTracking}/${filename}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return blob.url;
}

export async function deleteShipmentPhoto(url: string) {
  await del(url).catch(() => null);
}
