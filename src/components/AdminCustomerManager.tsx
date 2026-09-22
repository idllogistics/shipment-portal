"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/tracking";
import { formatDateTime } from "@/lib/format";

type Shipment = {
  id: string;
  trackingNumber: string;
  status: string;
};

type OrderRequest = {
  id: string;
  origin: string;
  destination: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  shipments: Shipment[];
  orderRequests: OrderRequest[];
};

export default function AdminCustomerManager({
  initialCustomer,
}: {
  initialCustomer: Customer;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState(initialCustomer);
  const [updating, setUpdating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function toggleActive() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !customer.active }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer((c) => ({ ...c, active: data.customer.active }));
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  }

  async function resetPassword() {
    if (!confirm(`Reset ${customer.name}'s password?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      const data = await res.json();
      if (res.ok) setTempPassword(data.tempPassword);
    } finally {
      setUpdating(false);
    }
  }

  function copyPassword() {
    if (!tempPassword) return;
    navigator.clipboard
      .writeText(
        `ShipTrack customer portal: ${window.location.origin}/portal/login\nEmail: ${customer.email}\nPassword: ${tempPassword}`
      )
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-slate-500">{customer.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              customer.active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {customer.active ? "Active" : "Inactive"}
          </span>
          <button
            onClick={toggleActive}
            disabled={updating}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {customer.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Passwords aren&rsquo;t stored in readable form — reset it to
          generate a new temporary one to share with {customer.name}.
        </p>
        <button
          onClick={resetPassword}
          disabled={updating}
          className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Reset password
        </button>

        {tempPassword && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              New password (shown once — share it now):
            </p>
            <p className="mt-1 font-mono text-sm">{tempPassword}</p>
            <button
              onClick={copyPassword}
              className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs hover:bg-amber-100"
            >
              {copied ? "Copied!" : "Copy login details"}
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold">
          Shipments{" "}
          <span className="text-sm font-normal text-slate-400">
            ({customer.shipments.length})
          </span>
        </h2>
        {customer.shipments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No shipments yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {customer.shipments.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium">{s.trackingNumber}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">
          Order requests{" "}
          <span className="text-sm font-normal text-slate-400">
            ({customer.orderRequests.length})
          </span>
        </h2>
        {customer.orderRequests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No requests submitted.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {customer.orderRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm"
              >
                <span>
                  {r.origin} → {r.destination}
                </span>
                <span className="text-xs text-slate-400">
                  {r.status} · {formatDateTime(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
