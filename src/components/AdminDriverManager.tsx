"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/tracking";
import { formatDateTime } from "@/lib/format";
import { useOrigin } from "@/lib/useOrigin";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

type Shipment = {
  id: string;
  trackingNumber: string;
  customerName: string;
  status: string;
};

type Driver = {
  id: string;
  name: string;
  phone: string | null;
  accessCode: string;
  active: boolean;
  lastLat: number | null;
  lastLng: number | null;
  lastAccuracy: number | null;
  lastLocationAt: string | null;
  shipments: Shipment[];
};

export default function AdminDriverManager({
  initialDriver,
}: {
  initialDriver: Driver;
}) {
  const router = useRouter();
  const [driver, setDriver] = useState(initialDriver);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const origin = useOrigin();
  const driverUrl = `${origin}/driver/${driver.accessCode}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(driverUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function toggleActive() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !driver.active }),
      });
      if (res.ok) {
        const data = await res.json();
        setDriver((d) => ({ ...d, active: data.driver.active }));
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  }

  const hasLocation = driver.lastLat != null && driver.lastLng != null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{driver.name}</h1>
          {driver.phone && (
            <p className="text-sm text-slate-500">{driver.phone}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              driver.active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {driver.active ? "Active" : "Inactive"}
          </span>
          <button
            onClick={toggleActive}
            disabled={updating}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {driver.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Driver link</h2>
        <p className="mt-1 text-sm text-slate-500">
          Send this link to {driver.name} (e.g. via WhatsApp or SMS). They
          open it on their phone and tap &ldquo;Start sharing location&rdquo;
          while on a delivery run — no app install needed.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            readOnly
            value={driverUrl}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
          />
          <button
            onClick={handleCopyLink}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Last known location</h2>
          {driver.lastLocationAt && (
            <span className="text-xs text-slate-400">
              {formatDateTime(driver.lastLocationAt)}
            </span>
          )}
        </div>
        {hasLocation ? (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <LiveMap
              lat={driver.lastLat as number}
              lng={driver.lastLng as number}
              accuracy={driver.lastAccuracy}
              label={driver.name}
              className="h-72 w-full"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No location reported yet. It will appear here once{" "}
            {driver.name} starts sharing from their driver link.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-semibold">
          Assigned shipments{" "}
          <span className="text-sm font-normal text-slate-400">
            ({driver.shipments.length})
          </span>
        </h2>
        {driver.shipments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No shipments assigned. Assign this driver from a shipment&apos;s
            page.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {driver.shipments.map((s) => (
              <Link
                key={s.id}
                href={`/admin/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm hover:bg-slate-50"
              >
                <span className="font-medium">{s.trackingNumber}</span>
                <span className="text-slate-500">{s.customerName}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
