import Link from "next/link";
import ShipmentView from "@/components/ShipmentView";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ShipTrack
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            Track another shipment
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <ShipmentView trackingNumber={decodeURIComponent(trackingNumber)} />
      </main>
    </div>
  );
}
