"use client";

import { useRouter } from "next/navigation";

export default function CustomerLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/customer/logout", { method: "POST" });
    router.push("/portal/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-slate-500 hover:text-slate-900">
      Log out
    </button>
  );
}
