"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. SHP-AB12CD34EF"
        className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        autoFocus
      />
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Track
      </button>
    </form>
  );
}
