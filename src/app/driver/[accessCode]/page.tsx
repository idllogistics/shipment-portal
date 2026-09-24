import DriverLocationSharer from "@/components/DriverLocationSharer";
import DriverLogoutButton from "@/components/DriverLogoutButton";

export default async function DriverPage({
  params,
}: {
  params: Promise<{ accessCode: string }>;
}) {
  const { accessCode } = await params;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            ShipTrack · Driver
          </span>
          <DriverLogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 py-8">
        <DriverLocationSharer accessCode={decodeURIComponent(accessCode)} />
      </main>
    </div>
  );
}
