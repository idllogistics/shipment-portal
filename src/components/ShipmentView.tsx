"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/tracking";
import { formatDateTime, formatTime } from "@/lib/format";

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

type DriverLocation = {
  lat: number;
  lng: number;
  accuracy: number | null;
  updatedAt: string;
};

type Shipment = {
  id: string;
  trackingNumber: string;
  customerName: string;
  origin: string | null;
  destination: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  events: Event[];
  driverLocation: DriverLocation | null;
};

const POLL_MS = 6000;

export default function ShipmentView({
  trackingNumber,
}: {
  trackingNumber: string;
}) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/track/${encodeURIComponent(trackingNumber)}`,
          { cache: "no-store" }
        );
        if (cancelled) return;
        if (!res.ok) {
          setError(
            res.status === 404
              ? "No shipment found with that tracking number."
              : "Something went wrong loading this shipment."
          );
          setShipment(null);
          return;
        }
        const data = await res.json();
        setError(null);
        setShipment(data.shipment);
        setLastUpdated(new Date());
      } catch {
        if (!cancelled) setError("Couldn't reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [trackingNumber]);

  if (loading) {
    return <p className="text-slate-500">Loading shipment…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!shipment) return null;

  const statusIndex = STATUS_ORDER.indexOf(
    shipment.status as (typeof STATUS_ORDER)[number]
  );
  const isException = shipment.status === "EXCEPTION";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Tracking number
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {shipment.trackingNumber}
          </h1>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              isException
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {STATUS_LABELS[shipment.status] ?? shipment.status}
          </span>
          {lastUpdated && (
            <p className="mt-1 text-xs text-slate-400">
              Live · updated {formatTime(lastUpdated)}
            </p>
          )}
        </div>
      </div>

      {!isException && (
        <ol className="flex items-center">
          {STATUS_ORDER.map((s, i) => {
            const reached = i <= statusIndex;
            return (
              <li key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      reached ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`hidden text-[11px] sm:block ${
                      reached ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </span>
                </div>
                {i < STATUS_ORDER.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 ${
                      i < statusIndex ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {shipment.driverLocation && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live driver location</h2>
            <span className="text-xs text-slate-400">
              Updated{" "}
              {formatTime(shipment.driverLocation.updatedAt)}
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <LiveMap
              lat={shipment.driverLocation.lat}
              lng={shipment.driverLocation.lng}
              accuracy={shipment.driverLocation.accuracy}
              label="Your shipment"
              className="h-72 w-full"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Recipient</p>
          <p className="mt-1 font-medium">{shipment.customerName}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Origin</p>
          <p className="mt-1 font-medium">{shipment.origin || "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Destination</p>
          <p className="mt-1 font-medium">{shipment.destination || "—"}</p>
        </div>
      </div>

      {shipment.notes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {shipment.notes}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">
          Photos{" "}
          <span className="text-sm font-normal text-slate-400">
            ({shipment.photos.length})
          </span>
        </h2>
        {shipment.photos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No photos have been uploaded for this shipment yet. Check back
            soon — this page updates automatically.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {shipment.photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setLightbox(photo)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || "Shipment photo"}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-left text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                  {formatDateTime(photo.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {shipment.events.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">History</h2>
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
                  {ev.message && (
                    <p className="text-slate-500">{ev.message}</p>
                  )}
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">
                  {formatDateTime(ev.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.caption || "Shipment photo"}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
