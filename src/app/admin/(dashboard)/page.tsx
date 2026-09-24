import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/tracking";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const shipments = await prisma.shipment.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { photos: true } }, driver: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
        <Link
          href="/admin/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + New shipment
        </Link>
      </div>

      {shipments.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No shipments yet. Create one to get started.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tracking #</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Photos</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${s.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {s.trackingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.customerName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.status === "EXCEPTION" || s.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : s.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.driver?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {s._count.photos}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(s.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
