import { NextRequest, NextResponse } from "next/server";

const RADAR_URL =
  "https://radar-engine-api-production.up.railway.app/get-last-tweet-by-joj";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json(
      { error: "ticker parameter is required" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `${RADAR_URL}?ticker=${encodeURIComponent(ticker)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Radar API request timed out"
        : "Failed to fetch from Radar API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
