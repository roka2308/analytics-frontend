import { NextRequest, NextResponse } from "next/server";
import { requireUser, assertSiteAccess } from "@/lib/auth/requireUser";
import { getVisitorsOverview } from "@/lib/matomo/transforms";

export async function GET(request: NextRequest) {
  try {
    await requireUser();

    const searchParams = request.nextUrl.searchParams;
    const siteId = parseInt(searchParams.get("siteId") ?? "0", 10);
    if (!siteId) {
      return NextResponse.json({ error: "siteId fehlt" }, { status: 400 });
    }

    const period = (searchParams.get("period") ?? "range") as
      | "day"
      | "week"
      | "month"
      | "range";
    const date = searchParams.get("date") ?? "last7";

    // Wirft / leitet um, wenn der User auf die Site keinen Zugriff hat
    await assertSiteAccess(siteId);

    const data = await getVisitorsOverview(siteId, period, date);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] dashboard/overview Fehler:", error);
    return NextResponse.json(
      { error: "Daten konnten nicht abgerufen werden" },
      { status: 500 }
    );
  }
}
