import Link from "next/link";
import DriverLogin from "@/components/DriverLogin";

export default function DriverLoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">ShipTrack · Driver</span>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            Home
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <DriverLogin />
      </main>
    </div>
  );
}
