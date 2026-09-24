import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <>
            <h1 className="text-xl font-semibold">Invalid link</h1>
            <p className="mt-2 text-sm text-slate-600">
              This reset link is missing its token. Request a new one below.
            </p>
            <Link
              href="/portal/forgot"
              className="mt-4 inline-block text-sm text-slate-700 hover:underline"
            >
              Request a reset link
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
