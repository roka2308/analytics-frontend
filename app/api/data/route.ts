// =============================================================
//  Route Handler: /api/data   (NUR serverseitig)
//
//  Server-Einstieg in die DataRegistry. Haelt DB-/API-Zugriff vom
//  Client fern (Credentials bleiben auf dem Server).
//
//  GET  /api/data                      -> Metrik-Katalog aller Quellen
//  POST /api/data                      -> eine Metrik in normalisiertem Format
//       Body: { sourceId, metricId, query: { from, to, granularity, filters? } }
//
//  Geschuetzt: nur eingeloggte Nutzer (401 sonst).
//  UI wird hier bewusst noch NICHT angefasst.
// =============================================================
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getDataRegistry } from "@/lib/registry.server";
import type { Granularity, Query } from "@/lib/datasource";

// mysql2 braucht die Node-Runtime (nicht Edge); Daten nie statisch cachen.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  return session?.user ? session : null;
}

const VALID_GRANULARITY: Granularity[] = ["day", "week", "month"];

function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  try {
    const metrics = await getDataRegistry().listAllMetrics();
    return NextResponse.json({ metrics });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unbekannter Fehler" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiges JSON" }, { status: 400 });
  }

  const { sourceId, metricId, query } = (body ?? {}) as {
    sourceId?: unknown;
    metricId?: unknown;
    query?: Partial<Query>;
  };

  if (typeof sourceId !== "string" || typeof metricId !== "string") {
    return NextResponse.json(
      { error: "sourceId und metricId (string) sind erforderlich" },
      { status: 400 },
    );
  }
  if (!query || !isIsoDate(query.from) || !isIsoDate(query.to)) {
    return NextResponse.json(
      { error: "query.from und query.to muessen ISO-Daten (YYYY-MM-DD) sein" },
      { status: 400 },
    );
  }
  const granularity: Granularity = VALID_GRANULARITY.includes(
    query.granularity as Granularity,
  )
    ? (query.granularity as Granularity)
    : "month";

  const normalizedQuery: Query = {
    from: query.from,
    to: query.to,
    granularity,
    filters: query.filters,
  };

  try {
    const result = await getDataRegistry().fetchFrom(
      sourceId,
      metricId,
      normalizedQuery,
    );
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unbekannter Fehler" },
      { status: 502 },
    );
  }
}
