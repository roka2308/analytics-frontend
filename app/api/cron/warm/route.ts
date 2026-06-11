// =============================================================
//  Route Handler: /api/cron/warm  (Cache-Vorwaermen)
//
//  Scheduler-agnostisch: aufrufbar von JEDEM Cron/Pinger via Secret
//  (?secret=... oder Authorization: Bearer ...), ODER von einem
//  eingeloggten Admin. Setze CRON_SECRET in den Env-Variablen.
//
//  Beispiel (Vercel Cron oder externer Cron):
//    GET https://<domain>/api/cron/warm?secret=<CRON_SECRET>
// =============================================================
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { warmAllDashboards } from "@/lib/cache/warm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Auf Vercel Pro: laengere Laufzeit erlauben (sonst greift das Plan-Limit).
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  let authorized = false;
  if (secret && provided && provided === secret) {
    authorized = true;
  } else {
    const session = await getServerSession(authOptions);
    if (session?.user?.role === "admin") authorized = true;
  }
  if (!authorized) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const summary = await warmAllDashboards();
  return NextResponse.json({ ok: true, summary });
}
