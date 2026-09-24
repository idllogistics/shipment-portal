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
  cancelReason: string | null;
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
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
  declineReason: string | null;
  cancelReason: string | null;
  createdAt: string;
};

const ORDER_STATUS_LABELS: Record<OrderRequest["status"], string> = {
  PENDING: "Awaiting review",
  APPROVED: "Approved",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

type CancelTarget = { kind: "request" | "shipment"; id: string; label: string };

export default function CustomerDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<CancelTarget | null>(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  function openCancel(t: CancelTarget) {
    setTarget(t);
    setReason("");
    setCancelError(null);
  }

  async function confirmCancel() {
    if (!target) return;
    if (!reason.trim()) {
      setCancelError("Please tell us why you're cancelling.");
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const url =
        target.kind === "request"
          ? `/api/customer/orders/${target.id}/cancel`
          : `/api/customer/shipments/${target.id}/cancel`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || "Couldn't cancel.");
        return;
      }
      if (target.kind === "request") {
        setOrderRequests((rs) =>
          rs.map((r) => (r.id === target.id ? { ...r, ...data.orderRequest } : r))
        );
      } else {
        setShipments((ss) =>
          ss.map((s) =>
            s.id === target.id
              ? {
                  ...s,
                  status: data.shipment.status,
                  cancelReason: data.shipment.cancelReason,
                  updatedAt: data.shipment.updatedAt,
                }
              : s
          )
        );
      }
      setTarget(null);
    } finally {
      setCancelling(false);
    }
  }

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
                <th className="px-4 py-3" />
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
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                    {s.status === "CANCELLED" && s.cancelReason && (
                      <p className="mt-1 text-xs text-slate-500">Reason: {s.cancelReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(s.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {s.status === "PENDING" && (
                      <button
                        onClick={() =>
                          openCancel({ kind: "shipment", id: s.id, label: s.trackingNumber })
                        }
                        className="text-xs text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Order requests</h2>
        {orderRequests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No requests submitted yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {orderRequests.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {r.origin} → {r.destination}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
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
                  <p className="mt-1 text-red-600">Declined: {r.declineReason}</p>
                )}
                {r.status === "CANCELLED" && r.cancelReason && (
                  <p className="mt-1 text-red-600">You cancelled: {r.cancelReason}</p>
                )}
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Submitted {formatDateTime(r.createdAt)}
                  </p>
                  {r.status === "PENDING" && (
                    <button
                      onClick={() =>
                        openCancel({
                          kind: "request",
                          id: r.id,
                          label: `${r.origin} → ${r.destination}`,
                        })
                      }
                      className="text-xs text-red-600 hover:underline"
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold">
              Cancel {target.kind === "request" ? "request" : "shipment"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{target.label}</p>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Reason <span className="text-red-500">*</span>
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            {cancelError && <p className="mt-2 text-sm text-red-600">{cancelError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
              >
                Keep it
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
