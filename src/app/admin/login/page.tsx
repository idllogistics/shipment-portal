"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Staff login</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the admin password to manage shipments.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-6 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
