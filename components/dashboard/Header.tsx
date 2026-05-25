import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/dashboard"
          className="text-xl font-semibold text-slate-900 hover:text-slate-700"
        >
          Analytics
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Einstellungen
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
