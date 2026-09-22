"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/tracking";
import { formatDateTime } from "@/lib/format";

type Shipment = {
  id: string;
  trackingNumber: string;
  origin: string | null;
  destination: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type OrderRequest = {
  id: string;
  origin: string;
  destination: string;
  itemDescription: string | null;
  itemQuantity: string | null;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "DECLINED";
  declineReason: string | null;
  createdAt: string;
};

const ORDER_STATUS_LABELS: Record<OrderRequest["status"], string> = {
  PENDING: "Awaiting review",
  APPROVED: "Approved",
  DECLINED: "Declined",
};

export default function CustomerDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setShipments(data.shipments);
        setOrderRequests(data.orderRequests);
      })
      .catch(() => setError("Couldn't load your account."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your shipments</h1>
        <Link
          href="/portal/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Request new order
        </Link>
      </div>

      {shipments.length === 0 ? (
        <p className="text-sm text-slate-500">No shipments yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tracking #</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/track/${s.trackingNumber}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {s.trackingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.origin || "—"} → {s.destination || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(s.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Order requests</h2>
        {orderRequests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No requests submitted yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {orderRequests.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {r.origin} → {r.destination}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "DECLINED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[r.status]}
                  </span>
                </div>
                {(r.itemDescription || r.itemQuantity) && (
                  <p className="mt-1 text-slate-500">
                    {r.itemDescription}
                    {r.itemQuantity ? ` · ${r.itemQuantity}` : ""}
                  </p>
                )}
                {r.status === "DECLINED" && r.declineReason && (
                  <p className="mt-1 text-red-600">Reason: {r.declineReason}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Submitted {formatDateTime(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
