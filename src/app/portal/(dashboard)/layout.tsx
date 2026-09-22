import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthedCustomerId } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";
import CustomerLogoutButton from "@/components/CustomerLogoutButton";

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customerId = await getAuthedCustomerId();
  if (!customerId) redirect("/portal/login");

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || !customer.active) redirect("/portal/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/portal" className="text-lg font-semibold tracking-tight">
            ShipTrack · {customer.name}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-500 hover:text-slate-900">
              View site
            </Link>
            <CustomerLogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
