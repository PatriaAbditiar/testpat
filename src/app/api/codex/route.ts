import { NextRequest, NextResponse } from "next/server";

const CODEX_URL = "https://graph.codex.io/graphql";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = process.env.CODEX_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CODEX_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(CODEX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Codex proxy error:", err);
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Codex API request timed out"
        : "Failed to fetch from Codex API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
