"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/tracking";
import { formatDateTime } from "@/lib/format";

type Request = {
  id: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  customer: { id: string; name: string; email: string };
  shipment: {
    id: string;
    trackingNumber: string;
    status: string;
    origin: string | null;
    destination: string | null;
  };
};

export default function AdminCancellationRequests({
  initialRequests,
}: {
  initialRequests: Request[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function review(id: string, body: object) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cancellations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setRequests((rs) =>
        rs.map((r) =>
          r.id === id
            ? {
                ...r,
                ...data.cancellationRequest,
                shipment:
                  data.cancellationRequest.status === "APPROVED"
                    ? { ...r.shipment, status: "CANCELLED" }
                    : r.shipment,
              }
            : r
        )
      );
      setRejectingId(null);
      setRejectReason("");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function handleReject(id: string) {
    if (!rejectReason.trim()) {
      setError("Please enter a reason for rejecting.");
      return;
    }
    review(id, { action: "REJECT", rejectReason });
  }

  if (requests.length === 0) {
    return <p className="text-sm text-slate-500">No cancellation requests yet.</p>;
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
              <Link
                href={`/admin/${r.shipment.id}`}
                className="font-semibold hover:underline"
              >
                {r.shipment.trackingNumber}
              </Link>
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {STATUS_LABELS[r.shipment.status] ?? r.shipment.status}
              </span>
              <p className="text-slate-500">
                {r.shipment.origin || "—"} → {r.shipment.destination || "—"}
              </p>
              <p className="text-slate-500">
                <Link href={`/admin/customers/${r.customer.id}`} className="hover:underline">
                  {r.customer.name}
                </Link>{" "}
                · {r.customer.email}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                r.status === "PENDING"
                  ? "bg-amber-100 text-amber-700"
                  : r.status === "APPROVED"
                  ? "bg-slate-200 text-slate-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {r.status === "PENDING"
                ? "Awaiting review"
                : r.status === "APPROVED"
                ? "Approved — cancelled"
                : "Rejected — shipment continues"}
            </span>
          </div>

          <p className="mt-3 text-slate-700">
            <span className="text-slate-400">Customer&rsquo;s reason:</span> {r.reason}
          </p>
          <p className="mt-1 text-xs text-slate-400">Requested {formatDateTime(r.createdAt)}</p>
          {r.status === "REJECTED" && r.rejectReason && (
            <p className="mt-2 text-red-600">Rejected: {r.rejectReason}</p>
          )}

          {r.status === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => review(r.id, { action: "APPROVE" })}
                disabled={busyId === r.id}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Approve cancellation
              </button>
              <button
                onClick={() => {
                  setRejectingId(rejectingId === r.id ? null : r.id);
                  setRejectReason("");
                  setError(null);
                }}
                disabled={busyId === r.id}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {r.status === "PENDING" && rejectingId === r.id && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <label className="block text-sm font-medium text-red-800">
                Reason for rejecting (shown to the customer)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={() => handleReject(r.id)}
                disabled={busyId === r.id}
                className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Confirm rejection
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
