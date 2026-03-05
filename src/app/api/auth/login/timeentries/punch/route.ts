import { NextResponse } from "next/server";

const API_BASE =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3011";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/wp_access=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ ok: false, error: "Sem sessão" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const upstream = await fetch(`${API_BASE}/timeentries/punch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${decodeURIComponent(token)}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}