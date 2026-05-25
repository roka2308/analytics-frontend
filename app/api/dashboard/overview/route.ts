import { NextRequest, NextResponse } from "next/server";
import { requireUser, assertSiteAccess } from "@/lib/auth/requireUser";
import { getVisitorsOverview } from "@/lib/matomo/transforms";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireUser();

    const searchParams = request.nextUrl.searchParams;
    const siteId = parseInt(searchParams.get("siteId") ?? "1");
    const period = (searchParams.get("period") ?? "week") as
      | "day"
      | "week"
      | "month"
      | "range";
    const date = searchParams.get("date") ?? "last7";

    await assertSiteAccess(userId, siteId);

    const data = await getVisitorsOverview(siteId, period, date);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("[API] dashboard/overview Fehler:", error);
    return NextResponse.json(
      { error: "Daten konnten nicht abgerufen werden" },
      { status: 500 }
    );
  }
}
