"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const DRIVER_CODE_KEY = "driver_access_code";

function extractCode(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/DRV-[A-Z0-9]+/i);
  return (match ? match[0] : trimmed).toUpperCase();
}

export default function DriverLogin() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRIVER_CODE_KEY);
      if (saved) router.replace(`/driver/${encodeURIComponent(saved)}`);
    } catch {
      // storage unavailable (private mode) — just show the form
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = extractCode(input);
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/driver/${encodeURIComponent(code)}`);
      if (!res.ok) {
        setError(
          res.status === 404
            ? "That driver code isn't recognised. Check it with dispatch."
            : "Something went wrong. Try again."
        );
        return;
      }
      const data = await res.json();
      if (!data.driver.active) {
        setError("This driver account is inactive. Contact dispatch.");
        return;
      }
      try {
        localStorage.setItem(DRIVER_CODE_KEY, code);
      } catch {
        // fine — they'll just log in again next time
      }
      router.push(`/driver/${encodeURIComponent(code)}`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <h1 className="text-xl font-semibold">Driver login</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the driver code (or paste the link) dispatch sent you.
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="DRV-XXXXXXXXXXXXXXXX"
        autoCapitalize="characters"
        autoCorrect="off"
        autoFocus
        className="mt-6 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
