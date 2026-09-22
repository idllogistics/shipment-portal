"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewShipmentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    origin: "",
    destination: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create shipment");
        return;
      }
      router.push(`/admin/${data.shipment.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to shipments
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">New shipment</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <Field label="Recipient name" required>
          <input
            required
            value={form.customerName}
            onChange={(e) => update("customerName", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Recipient email (optional)">
          <input
            type="email"
            value={form.customerEmail}
            onChange={(e) => update("customerEmail", e.target.value)}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Origin">
            <input
              value={form.origin}
              onChange={(e) => update("origin", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Destination">
            <input
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create shipment"}
        </button>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: rgb(15 23 42);
          box-shadow: 0 0 0 1px rgb(15 23 42);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
