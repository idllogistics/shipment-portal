import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDriverManager from "@/components/AdminDriverManager";

export const dynamic = "force-dynamic";

export default async function AdminDriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      shipments: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!driver) notFound();

  return (
    <div>
      <Link
        href="/admin/drivers"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to drivers
      </Link>
      <div className="mt-2">
        <AdminDriverManager initialDriver={JSON.parse(JSON.stringify(driver))} />
      </div>
    </div>
  );
}
