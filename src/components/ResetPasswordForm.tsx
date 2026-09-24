"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't reset password");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Password updated</h1>
        <p className="mt-2 text-sm text-slate-600">
          You can now sign in with your new password.
        </p>
        <Link
          href="/portal/login"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-xl font-semibold">Set a new password</h1>
      <label className="mt-5 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">New password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
        />
      </label>
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Confirm password
        </span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
        />
      </label>
      <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
