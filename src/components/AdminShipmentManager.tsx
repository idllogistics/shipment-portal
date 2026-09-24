"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/tracking";
import { formatDateTime } from "@/lib/format";
import { useOrigin } from "@/lib/useOrigin";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
};

type Event = {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
};

type Driver = {
  id: string;
  name: string;
  active: boolean;
  lastLat: number | null;
  lastLng: number | null;
  lastAccuracy: number | null;
  lastLocationAt: string | null;
};

type Checkpoint = {
  id: string;
  type: "PICKUP" | "DELIVERY";
  condition: "GOOD" | "DAMAGED";
  conditionNotes: string | null;
  approverName: string;
  approverRole: "SENDER" | "RECEIVER";
  signatureUrl: string;
  photos: Photo[];
  createdAt: string;
};

type ShipmentDocument = {
  id: string;
  url: string;
  filename: string;
  itemDescription: string | null;
  itemQuantity: string | null;
  declaredValue: number | null;
  declaredValueCurrency: string | null;
  extractionError: string | null;
  createdAt: string;
};

type Shipment = {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerEmail: string | null;
  origin: string | null;
  destination: string | null;
  status: string;
  notes: string | null;
  cancelReason: string | null;
  cancelledBy: "CUSTOMER" | "ADMIN" | null;
  cancellationRequests?: { reason: string; createdAt: string }[];
  itemDescription: string | null;
  itemQuantity: string | null;
  declaredValue: number | null;
  declaredValueCurrency: string | null;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  events: Event[];
  checkpoints: Checkpoint[];
  documents: ShipmentDocument[];
  driverId: string | null;
  driver: Driver | null;
};

// Cancelling goes through its own action so a reason is always recorded.
const STATUS_OPTIONS = Object.keys(STATUS_LABELS).filter((s) => s !== "CANCELLED");

export default function AdminShipmentManager({
  initialShipment,
}: {
  initialShipment: Shipment;
}) {
  const router = useRouter();
  const [shipment, setShipment] = useState(initialShipment);
  const [status, setStatus] = useState(
    shipment.status === "CANCELLED" ? "PENDING" : shipment.status
  );
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [itemDescription, setItemDescription] = useState(
    initialShipment.itemDescription ?? ""
  );
  const [itemQuantity, setItemQuantity] = useState(initialShipment.itemQuantity ?? "");
  const [declaredValue, setDeclaredValue] = useState(
    initialShipment.declaredValue != null ? String(initialShipment.declaredValue) : ""
  );
  const [declaredValueCurrency, setDeclaredValueCurrency] = useState(
    initialShipment.declaredValueCurrency ?? "AED"
  );
  const [savingItems, setSavingItems] = useState(false);

  useEffect(() => {
    fetch("/api/admin/drivers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDrivers(data.drivers);
      })
      .catch(() => {});
  }, []);

  const origin = useOrigin();
  const trackUrl = `${origin}/track/${shipment.trackingNumber}`;

  async function refresh() {
    const res = await fetch(`/api/admin/shipments/${shipment.id}`);
    if (res.ok) {
      const data = await res.json();
      setShipment(data.shipment);
    }
    router.refresh();
  }

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shipments/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, message: statusMessage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status");
        return;
      }
      setShipment(data.shipment);
      setStatusMessage("");
      router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Choose at least one photo");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("photos", f));
      if (caption) formData.append("caption", caption);

      const res = await fetch(`/api/admin/shipments/${shipment.id}/photos`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload photo");
        return;
      }
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(
      `/api/admin/shipments/${shipment.id}/photos?photoId=${photoId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setShipment((s) => ({
        ...s,
        photos: s.photos.filter((p) => p.id !== photoId),
      }));
    }
  }

  async function handleAssignDriver(driverId: string) {
    setAssigningDriver(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shipments/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driverId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to assign driver");
        return;
      }
      setShipment(data.shipment);
      router.refresh();
    } finally {
      setAssigningDriver(false);
    }
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault();
    const file = documentInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a document to upload");
      return;
    }
    setUploadingDocument(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch(`/api/admin/shipments/${shipment.id}/documents`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload document");
        return;
      }
      if (documentInputRef.current) documentInputRef.current.value = "";
      setItemDescription(data.shipment.itemDescription ?? "");
      setItemQuantity(data.shipment.itemQuantity ?? "");
      setDeclaredValue(
        data.shipment.declaredValue != null ? String(data.shipment.declaredValue) : ""
      );
      setDeclaredValueCurrency(data.shipment.declaredValueCurrency ?? "AED");
      await refresh();
    } finally {
      setUploadingDocument(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!confirm("Delete this document?")) return;
    const res = await fetch(
      `/api/admin/shipments/${shipment.id}/documents?documentId=${documentId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setShipment((s) => ({
        ...s,
        documents: s.documents.filter((d) => d.id !== documentId),
      }));
    }
  }

  async function handleSaveItemFields(e: React.FormEvent) {
    e.preventDefault();
    setSavingItems(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shipments/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemDescription,
          itemQuantity,
          declaredValue: declaredValue ? Number(declaredValue) : null,
          declaredValueCurrency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save item details");
        return;
      }
      setShipment(data.shipment);
      router.refresh();
    } finally {
      setSavingItems(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      setError("Please enter a reason for cancelling.");
      return;
    }
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shipments/${shipment.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to cancel");
        return;
      }
      setShowCancel(false);
      setCancelReason("");
      await refresh();
    } finally {
      setCancelling(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(trackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {shipment.trackingNumber}
          </h1>
          <p className="text-sm text-slate-500">
            {shipment.customerName}
            {shipment.customerEmail ? ` · ${shipment.customerEmail}` : ""}
          </p>
        </div>
        <button
          onClick={handleCopyLink}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          {copied ? "Copied!" : "Copy customer link"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {shipment.status !== "CANCELLED" && (shipment.cancellationRequests?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">The customer has asked to cancel this order</p>
          <p className="mt-1">Reason: {shipment.cancellationRequests?.[0].reason}</p>
          <Link href="/admin/cancellations" className="mt-2 inline-block font-medium underline">
            Review the request →
          </Link>
        </div>
      )}

      {shipment.status === "CANCELLED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">
            Cancelled by {shipment.cancelledBy === "CUSTOMER" ? "the customer" : "staff"}
          </p>
          {shipment.cancelReason && <p className="mt-1">Reason: {shipment.cancelReason}</p>}
          <p className="mt-1 text-xs text-red-600">
            Choosing a new status below reinstates this shipment.
          </p>
        </div>
      )}

      {shipment.status !== "CANCELLED" && shipment.status !== "DELIVERED" && (
        <div>
          {!showCancel ? (
            <button
              onClick={() => setShowCancel(true)}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Cancel shipment
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <label className="block text-sm font-medium text-red-800">
                Reason for cancelling (shown to the customer)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {cancelling ? "Cancelling…" : "Confirm cancel"}
                </button>
                <button
                  onClick={() => setShowCancel(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600"
                >
                  Keep shipment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Update status</h2>
          <p className="mt-1 text-xs text-slate-400">
            Status now advances automatically when the driver records pickup
            or delivery below — use this only to override, or for shipments
            with no driver assigned.
          </p>
          <form onSubmit={handleStatusUpdate} className="mt-4 space-y-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <input
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="Optional note for this update"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={updating}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {updating ? "Updating…" : "Update status"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Upload photos</h2>
          <form onSubmit={handleUpload} className="mt-4 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="block w-full text-sm"
            />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Driver</h2>
          {shipment.driver && (
            <Link
              href={`/admin/drivers/${shipment.driver.id}`}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              View driver →
            </Link>
          )}
        </div>
        <select
          value={shipment.driverId ?? ""}
          onChange={(e) => handleAssignDriver(e.target.value)}
          disabled={assigningDriver}
          className="mt-3 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Unassigned</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.active ? "" : " (inactive)"}
            </option>
          ))}
        </select>

        {shipment.driver &&
          shipment.driver.lastLat != null &&
          shipment.driver.lastLng != null && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-slate-400">
                {shipment.driver.name}&rsquo;s last location
                {shipment.driver.lastLocationAt &&
                  ` · ${formatDateTime(shipment.driver.lastLocationAt)}`}
              </p>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <LiveMap
                  lat={shipment.driver.lastLat}
                  lng={shipment.driver.lastLng}
                  accuracy={shipment.driver.lastAccuracy}
                  label={shipment.driver.name}
                  className="h-64 w-full"
                />
              </div>
            </div>
          )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Item details</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fill in manually, or upload an invoice/packing list below to
          auto-fill these from it.
        </p>
        <form onSubmit={handleSaveItemFields} className="mt-4 space-y-3">
          <input
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="Item description"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              placeholder="Quantity"
              className="col-span-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
              placeholder="Declared value"
              inputMode="decimal"
              className="col-span-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={declaredValueCurrency}
              onChange={(e) => setDeclaredValueCurrency(e.target.value)}
              placeholder="AED"
              className="col-span-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingItems}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {savingItems ? "Saving…" : "Save item details"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-medium text-slate-700">
            Documents (invoice / packing list)
          </h3>
          <form onSubmit={handleUploadDocument} className="mt-3 flex gap-2">
            <input
              ref={documentInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="block flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={uploadingDocument}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {uploadingDocument ? "Reading…" : "Upload"}
            </button>
          </form>
          {uploadingDocument && (
            <p className="mt-2 text-xs text-slate-400">
              Uploading and reading the document — this can take a few
              seconds.
            </p>
          )}

          {shipment.documents.length > 0 && (
            <ul className="mt-3 space-y-2">
              {shipment.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {doc.filename}
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  {doc.extractionError ? (
                    <p className="mt-1 text-xs text-amber-600">
                      Couldn&rsquo;t auto-read this document: {doc.extractionError}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      Read: {doc.itemDescription || "—"}
                      {doc.itemQuantity ? ` · ${doc.itemQuantity}` : ""}
                      {doc.declaredValue != null
                        ? ` · ${doc.declaredValueCurrency ?? ""} ${doc.declaredValue}`
                        : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {shipment.checkpoints.length > 0 && (
        <section>
          <h2 className="font-semibold">Pickup &amp; delivery proof</h2>
          <div className="mt-3 space-y-3">
            {shipment.checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    {cp.type === "PICKUP" ? "Picked up" : "Delivered"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      cp.condition === "GOOD"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    Condition: {cp.condition === "GOOD" ? "Good" : "Damaged"}
                  </span>
                </div>
                <p className="mt-1 text-slate-500">
                  Approved by {cp.approverName} (
                  {cp.approverRole === "SENDER" ? "Sender" : "Receiver"}) ·{" "}
                  {formatDateTime(cp.createdAt)}
                </p>
                {cp.conditionNotes && (
                  <p className="mt-1 text-slate-600">{cp.conditionNotes}</p>
                )}
                <div className="mt-3 flex flex-wrap items-end gap-4">
                  <div>
                    <p className="mb-1 text-xs text-slate-400">Signature</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cp.signatureUrl}
                      alt={`${cp.approverName}'s signature`}
                      className="h-16 rounded border border-slate-200 bg-white"
                    />
                  </div>
                  {cp.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="h-16 w-16 overflow-hidden rounded border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt="Item photo"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold">
          Photos{" "}
          <span className="text-sm font-normal text-slate-400">
            ({shipment.photos.length})
          </span>
        </h2>
        {shipment.photos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No photos yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {shipment.photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || "Shipment photo"}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {shipment.events.length > 0 && (
        <section>
          <h2 className="font-semibold">History</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {shipment.events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5"
              >
                <div>
                  <p className="font-medium">
                    {STATUS_LABELS[ev.status] ?? ev.status}
                  </p>
                  {ev.message && <p className="text-slate-500">{ev.message}</p>}
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">
                  {formatDateTime(ev.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
