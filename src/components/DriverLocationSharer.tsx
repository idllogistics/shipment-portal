"use client";

import { useEffect, useRef, useState } from "react";
import { STATUS_LABELS } from "@/lib/tracking";
import { formatTime } from "@/lib/format";

type Shipment = {
  id: string;
  trackingNumber: string;
  customerName: string;
  destination: string | null;
  status: string;
};

type Driver = {
  id: string;
  name: string;
  active: boolean;
  lastLocationAt: string | null;
  shipments: Shipment[];
};

const MIN_POST_INTERVAL_MS = 12000;

export default function DriverLocationSharer({
  accessCode,
}: {
  accessCode: string;
}) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [pingCount, setPingCount] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const lastPostRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/driver/${encodeURIComponent(accessCode)}`);
        if (cancelled) return;
        if (!res.ok) {
          setError(
            res.status === 404
              ? "This driver link isn't valid. Ask dispatch for a new one."
              : "Something went wrong loading your info."
          );
          return;
        }
        const data = await res.json();
        setDriver(data.driver);
      } catch {
        if (!cancelled) setError("Couldn't reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessCode]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  function sendLocation(position: GeolocationPosition) {
    const now = Date.now();
    if (now - lastPostRef.current < MIN_POST_INTERVAL_MS) return;
    lastPostRef.current = now;

    fetch(`/api/driver/${encodeURIComponent(accessCode)}/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setLastSentAt(new Date());
          setPingCount((c) => c + 1);
          setGeoError(null);
        }
      })
      .catch(() => {
        // transient network issue; the next watchPosition update will retry
      });
  }

  function startSharing() {
    if (!("geolocation" in navigator)) {
      setGeoError("This device/browser doesn't support location sharing.");
      return;
    }
    setGeoError(null);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setSharing(true);
        sendLocation(position);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser/site settings to share."
            : "Couldn't get your location. Make sure GPS is on."
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    watchIdRef.current = id;
  }

  function stopSharing() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!driver) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Welcome,</p>
        <h1 className="text-2xl font-bold tracking-tight">{driver.name}</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <button
          onClick={sharing ? stopSharing : startSharing}
          className={`w-full rounded-full px-6 py-4 text-base font-semibold text-white transition ${
            sharing ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-700"
          }`}
        >
          {sharing ? "Stop sharing location" : "Start sharing location"}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              sharing ? "animate-pulse bg-emerald-500" : "bg-slate-300"
            }`}
          />
          <span className="text-slate-600">
            {sharing ? "Sharing live" : "Not sharing"}
          </span>
        </div>

        {lastSentAt && (
          <p className="mt-2 text-xs text-slate-400">
            Last sent {formatTime(lastSentAt)} · {pingCount} update
            {pingCount === 1 ? "" : "s"} sent
          </p>
        )}

        {geoError && (
          <p className="mt-3 text-sm text-red-600">{geoError}</p>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Keep this page open in your browser while on a delivery run. Your
          location is only shared while sharing is on, and is only used for
          your assigned shipments below.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700">
          Your active shipments
        </h2>
        {driver.shipments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No active shipments assigned right now.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {driver.shipments.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.trackingNumber}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </div>
                <p className="mt-1 text-slate-500">
                  {s.customerName}
                  {s.destination ? ` · ${s.destination}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
