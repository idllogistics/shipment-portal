"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Forgot your password?</h1>
        {sent ? (
          <>
            <p className="mt-3 text-sm text-slate-600">
              If that email belongs to an active account, our team has been
              notified and will send you a link to set a new password.
            </p>
            <Link
              href="/portal/login"
              className="mt-5 inline-block text-sm text-slate-700 hover:underline"
            >
              ← Back to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mt-1 text-sm text-slate-500">
              Enter your account email and we&rsquo;ll get a reset link to you.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoFocus
              className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Request reset link"}
            </button>
            <Link
              href="/portal/login"
              className="mt-4 block text-center text-sm text-slate-500 hover:text-slate-900"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
