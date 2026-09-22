import { prisma } from "@/lib/prisma";
import AdminOrderRequests from "@/components/AdminOrderRequests";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orderRequests = await prisma.orderRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Order requests</h1>
      <p className="mt-1 text-sm text-slate-500">
        Requests customers submit from their portal. Approving one creates a
        real trackable shipment.
      </p>
      <div className="mt-6">
        <AdminOrderRequests
          initialOrderRequests={JSON.parse(JSON.stringify(orderRequests))}
        />
      </div>
    </div>
  );
}
