"use client";

import { useRouter } from "next/navigation";
import { DRIVER_CODE_KEY } from "@/components/DriverLogin";

export default function DriverLogoutButton() {
  const router = useRouter();

  function handleLogout() {
    try {
      localStorage.removeItem(DRIVER_CODE_KEY);
    } catch {
      // nothing stored to clear
    }
    router.push("/driver");
  }

  return (
    <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-900">
      Log out
    </button>
  );
}
