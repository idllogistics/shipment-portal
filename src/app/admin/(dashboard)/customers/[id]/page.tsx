import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminCustomerManager from "@/components/AdminCustomerManager";

export const dynamic = "force-dynamic";

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
      shipments: { orderBy: { updatedAt: "desc" } },
      orderRequests: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) notFound();

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to customers
      </Link>
      <div className="mt-2">
        <AdminCustomerManager initialCustomer={JSON.parse(JSON.stringify(customer))} />
      </div>
    </div>
  );
}
