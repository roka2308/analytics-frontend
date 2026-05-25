import { Suspense } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import { Header } from "@/components/dashboard/Header";
import { KpiCard, KpiCardSkeleton } from "@/components/dashboard/KpiCard";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { TopPagesTable } from "@/components/dashboard/TopPagesTable";
import { VisitorTrendChart } from "@/components/charts/VisitorTrendChart";
import { Skeleton } from "@/components/ui/skeleton";
import { getVisitorsOverview, getVisitorTrend } from "@/lib/matomo/transforms";
import { getCacheAge } from "@/lib/matomo/cache";
import { formatDuration } from "@/lib/utils";

const SITE_ID = parseInt(process.env.DEFAULT_MATOMO_SITE_ID ?? "1");

// Zeitraum-Parameter aus URL-Wert berechnen
function getRangeConfig(range: string) {
  switch (range) {
    case "today":
      return { period: "day" as const, date: "today", label: "Heute", trendDays: 7 };
    case "30":
      return { period: "range" as const, date: "last30", label: "letzten 30 Tage", trendDays: 30 };
    case "90":
      return { period: "range" as const, date: "last90", label: "letzten 90 Tage", trendDays: 90 };
    default:
      return { period: "range" as const, date: "last7", label: "letzten 7 Tage", trendDays: 7 };
  }
}

// KPI-Karten mit echten Daten
async function KpiSection({ period, date, trendDays }: {
  period: "day" | "range";
  date: string;
  trendDays: number;
}) {
  let overview;
  let cacheAgeMinutes: number | null = null;
  let error: string | null = null;

  try {
    overview = await getVisitorsOverview(SITE_ID, period, date);
    cacheAgeMinutes = await getCacheAge(`visitors_overview_${SITE_ID}_${period}_${date}`);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unbekannter Fehler";
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">Matomo ist nicht erreichbar</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-2">
      {cacheAgeMinutes !== null && cacheAgeMinutes > 0 && (
        <p className="text-xs text-slate-400">
          Daten von vor {cacheAgeMinutes} {cacheAgeMinutes === 1 ? "Minute" : "Minuten"} · wird alle 10 Min. aktualisiert
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Besuche"
          value={overview.visits.toLocaleString("de-DE")}
        />
        <KpiCard
          title="Seitenaufrufe"
          value={overview.pageviews.toLocaleString("de-DE")}
        />
        <KpiCard
          title="Bounce Rate"
          value={overview.bounceRate}
          description="Anteil Einzel-Seitenbesuche"
        />
        <KpiCard
          title="Ø Verweildauer"
          value={formatDuration(overview.avgVisitDurationSeconds)}
          description="pro Besuch"
        />
      </div>
    </div>
  );
}

// Trend-Diagramm mit echten Daten
async function TrendSection({ trendDays }: { trendDays: number }) {
  let data: Awaited<ReturnType<typeof getVisitorTrend>> = [];

  try {
    data = await getVisitorTrend(SITE_ID, trendDays);
  } catch {
    // Fehler still ignorieren – Chart zeigt leeren Zustand
  }

  return <VisitorTrendChart data={data} />;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  await requireUser();

  const range = searchParams.range ?? "7";
  const { period, date, label, trendDays } = getRangeConfig(range);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Titel + Zeitraum-Auswahl */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">
                Daten der {label}
              </p>
            </div>
            <Suspense fallback={<Skeleton className="h-10 w-72" />}>
              <DateRangePicker />
            </Suspense>
          </div>

          {/* KPI-Karten */}
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCardSkeleton /><KpiCardSkeleton />
                <KpiCardSkeleton /><KpiCardSkeleton />
              </div>
            }
          >
            <KpiSection period={period} date={date} trendDays={trendDays} />
          </Suspense>

          {/* Besuchertrend */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-slate-700">
              Besuchertrend – täglich
            </h2>
            <Suspense fallback={<Skeleton className="h-52 w-full" />}>
              <TrendSection trendDays={trendDays} />
            </Suspense>
          </div>

          {/* Top-Seiten */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-slate-700">
              Top-Seiten
            </h2>
            <Suspense
              fallback={
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              }
            >
              <TopPagesTable siteId={SITE_ID} period={period} date={date} />
            </Suspense>
          </div>

        </div>
      </main>
    </div>
  );
}
