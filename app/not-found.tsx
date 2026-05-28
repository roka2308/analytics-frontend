import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-medium text-slate-400">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Seite nicht gefunden
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          Die Seite, die du gesucht hast, existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
