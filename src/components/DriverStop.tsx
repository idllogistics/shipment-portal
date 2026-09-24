import { googleMapsUrl, wazeUrl } from "@/lib/navigation";

export default function DriverStop({
  label,
  address,
  isNext,
}: {
  label: string;
  address: string | null;
  isNext: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        isNext ? "border-slate-900 bg-slate-50" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {isNext && (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white">
            Next stop
          </span>
        )}
      </div>

      {address ? (
        <>
          <p className="mt-1 text-sm font-medium text-slate-900">{address}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a
              href={googleMapsUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-medium text-slate-800"
            >
              Google Maps
            </a>
            <a
              href={wazeUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-medium text-slate-800"
            >
              Waze
            </a>
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-400">Not set — ask dispatch</p>
      )}
    </div>
  );
}
