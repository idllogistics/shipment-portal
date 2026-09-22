import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminShipmentManager from "@/components/AdminShipmentManager";

export const dynamic = "force-dynamic";

export default async function AdminShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!shipment) notFound();

  return (
    <div>
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to shipments
      </Link>
      <div className="mt-2">
        <AdminShipmentManager
          initialShipment={JSON.parse(JSON.stringify(shipment))}
        />
      </div>
    </div>
  );
}
