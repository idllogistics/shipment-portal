"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        return;
      }
      router.push("/portal");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ShipTrack
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            Track a shipment
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <h1 className="text-xl font-semibold">Customer portal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Log in to view your shipments and request new orders.
          </p>

          <label className="mt-6 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </label>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Don&rsquo;t have an account? Contact us to get set up.
          </p>
        </form>
      </main>
    </div>
  );
}
