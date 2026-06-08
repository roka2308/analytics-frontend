// =============================================================
//  Route Handler: /api/matomo/reports?siteId=  (server-only)
//
//  Liefert den vollstaendigen Report-Katalog (alle Dimensionen/Metriken)
//  einer Matomo-Site an die Editor-Config-UI. Auth-geschuetzt.
// =============================================================
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getReportCatalog } from "@/lib/matomo/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const siteId = Number(searchParams.get("siteId"));
  if (!Number.isFinite(siteId) || siteId <= 0) {
    return NextResponse.json({ error: "Ungültige siteId" }, { status: 400 });
  }

  try {
    const reports = await getReportCatalog(siteId);
    return NextResponse.json({ reports });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unbekannter Fehler" },
      { status: 502 },
    );
  }
}
