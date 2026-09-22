import Link from "next/link";
import TrackForm from "@/components/TrackForm";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">ShipTrack</span>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/portal/login"
              className="text-slate-500 hover:text-slate-900"
            >
              Customer login
            </Link>
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-900"
            >
              Staff login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Track your shipment
          </h1>
          <p className="mt-2 text-slate-600">
            Enter your tracking number to see live status and photo updates
            of your shipment.
          </p>

          <div className="mt-8">
            <TrackForm />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        ShipTrack — live shipment photo tracking
      </footer>
    </div>
  );
}
