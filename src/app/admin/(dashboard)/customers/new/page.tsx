"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewCustomerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{
    name: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create customer");
        return;
      }
      setCreated({ name, email, tempPassword: data.tempPassword });
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!created) return;
    navigator.clipboard
      .writeText(
        `ShipTrack customer portal: ${
          typeof window !== "undefined" ? window.location.origin : ""
        }/portal/login\nEmail: ${created.email}\nPassword: ${created.tempPassword}`
      )
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  }

  if (created) {
    return (
      <div className="max-w-lg">
        <Link href="/admin/customers" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Customer created</h1>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-800">
            Share these login details with {created.name} — this password is
            only shown once and isn&rsquo;t stored anywhere else. Reset it
            from their customer page any time if it&rsquo;s lost.
          </p>
          <div className="mt-4 space-y-2 rounded-lg bg-white p-4 text-sm">
            <p>
              <span className="text-slate-400">Email:</span> {created.email}
            </p>
            <p>
              <span className="text-slate-400">Password:</span>{" "}
              <span className="font-mono">{created.tempPassword}</span>
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="mt-4 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm hover:bg-amber-100"
          >
            {copied ? "Copied!" : "Copy login details"}
          </button>
        </div>

        <Link
          href="/admin/customers"
          className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Done
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin/customers" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to customers
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">New customer</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Name <span className="text-red-500">*</span>
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Email <span className="text-red-500">*</span>
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create customer"}
        </button>
        <p className="text-xs text-slate-400">
          A temporary password is generated automatically — you&rsquo;ll see
          it on the next screen to share with the customer.
        </p>
      </form>
    </div>
  );
}
