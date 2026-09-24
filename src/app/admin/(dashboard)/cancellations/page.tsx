import { prisma } from "@/lib/prisma";
import AdminCancellationRequests from "@/components/AdminCancellationRequests";

export const dynamic = "force-dynamic";

export default async function AdminCancellationsPage() {
  const requests = await prisma.cancellationRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      customer: { select: { id: true, name: true, email: true } },
      shipment: { select: { id: true, trackingNumber: true, status: true, origin: true, destination: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Cancellation requests</h1>
      <p className="mt-1 text-sm text-slate-500">
        Customers can&rsquo;t cancel an accepted order themselves — they ask,
        and you approve or reject here. Approving cancels the shipment.
      </p>
      <div className="mt-6">
        <AdminCancellationRequests initialRequests={JSON.parse(JSON.stringify(requests))} />
      </div>
    </div>
  );
}
