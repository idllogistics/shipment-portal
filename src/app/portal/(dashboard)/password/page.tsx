"use client";

import { useState } from "react";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (newPassword !== confirm) {
      setError("New passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't change password");
        return;
      }
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { label: "Current password", value: currentPassword, set: setCurrentPassword },
    { label: "New password", value: newPassword, set: setNewPassword },
    { label: "Confirm new password", value: confirm, set: setConfirm },
  ];

  return (
    <div className="max-w-md">
      <Link href="/portal" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Change password</h1>
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        {fields.map((f) => (
          <label key={f.label} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{f.label}</span>
            <input
              type="password"
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-700">Password updated.</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
