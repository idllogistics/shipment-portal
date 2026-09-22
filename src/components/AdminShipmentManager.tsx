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

type Shipment = {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerEmail: string | null;
  origin: string | null;
  destination: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  events: Event[];
  driverId: string | null;
  driver: Driver | null;
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export default function AdminShipmentManager({
  initialShipment,
}: {
  initialShipment: Shipment;
}) {
  const router = useRouter();
  const [shipment, setShipment] = useState(initialShipment);
  const [status, setStatus] = useState(shipment.status);
  const [statusMessage, setStatusMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Update status</h2>
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
