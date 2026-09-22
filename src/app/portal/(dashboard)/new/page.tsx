"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewOrderRequestPage() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    itemDescription: "",
    itemQuantity: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit request");
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-emerald-800">Request submitted</h1>
        <p className="mt-2 text-sm text-emerald-700">
          We&rsquo;ll review it and get back to you. You can check its status
          on your dashboard.
        </p>
        <Link
          href="/portal"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link href="/portal" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Request a new order</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tell us what you need shipped — we&rsquo;ll review it and set up
        tracking once approved.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Origin <span className="text-red-500">*</span>
            </span>
            <input
              required
              value={form.origin}
              onChange={(e) => update("origin", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Destination <span className="text-red-500">*</span>
            </span>
            <input
              required
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Item description
          </span>
          <input
            value={form.itemDescription}
            onChange={(e) => update("itemDescription", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Quantity</span>
          <input
            value={form.itemQuantity}
            onChange={(e) => update("itemQuantity", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Notes (optional)
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
