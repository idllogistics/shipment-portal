import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthed } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthed();
  if (!authed) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-lg font-semibold tracking-tight">
            ShipTrack · Staff
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-500 hover:text-slate-900">
              View site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
