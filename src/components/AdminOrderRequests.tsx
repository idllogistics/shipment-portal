"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";

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
  shipmentId: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string };
};

export default function AdminOrderRequests({
  initialOrderRequests,
}: {
  initialOrderRequests: OrderRequest[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialOrderRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to approve");
        return;
      }
      setRequests((rs) =>
        rs.map((r) => (r.id === id ? { ...r, ...data.orderRequest } : r))
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(id: string) {
    if (!declineReason.trim()) {
      setError("Please enter a reason for declining.");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DECLINE", declineReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to decline");
        return;
      }
      setRequests((rs) =>
        rs.map((r) => (r.id === id ? { ...r, ...data.orderRequest } : r))
      );
      setDecliningId(null);
      setDeclineReason("");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return <p className="text-sm text-slate-500">No order requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {requests.map((r) => (
        <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">
                {r.origin} → {r.destination}
              </p>
              <p className="text-slate-500">
                <Link
                  href={`/admin/customers/${r.customer.id}`}
                  className="hover:underline"
                >
                  {r.customer.name}
                </Link>{" "}
                · {r.customer.email}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                r.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-700"
                  : r.status === "PENDING"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {r.status}
            </span>
          </div>

          {(r.itemDescription || r.itemQuantity) && (
            <p className="mt-2 text-slate-600">
              {r.itemDescription}
              {r.itemQuantity ? ` · ${r.itemQuantity}` : ""}
            </p>
          )}
          {r.notes && <p className="mt-1 text-slate-500">{r.notes}</p>}
          <p className="mt-1 text-xs text-slate-400">
            Submitted {formatDateTime(r.createdAt)}
          </p>

          {r.status === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleApprove(r.id)}
                disabled={busyId === r.id}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setDecliningId(decliningId === r.id ? null : r.id);
                  setDeclineReason("");
                  setError(null);
                }}
                disabled={busyId === r.id}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}

          {r.status === "PENDING" && decliningId === r.id && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <label className="block text-sm font-medium text-red-800">
                Reason for declining (shown to the customer)
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={() => handleDecline(r.id)}
                disabled={busyId === r.id}
                className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Confirm decline
              </button>
            </div>
          )}

          {r.status === "APPROVED" && r.shipmentId && (
            <Link
              href={`/admin/${r.shipmentId}`}
              className="mt-2 inline-block text-sm text-slate-700 hover:underline"
            >
              View shipment →
            </Link>
          )}
          {r.status === "DECLINED" && r.declineReason && (
            <p className="mt-2 text-red-600">Declined: {r.declineReason}</p>
          )}
          {r.status === "CANCELLED" && (
            <p className="mt-2 text-red-600">
              Cancelled by customer{r.cancelReason ? ": " + r.cancelReason : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
