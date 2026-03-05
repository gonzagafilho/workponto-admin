import { NextResponse } from "next/server";

const API_BASE =
  (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3011") + "/api";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/wp_access=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ ok: false, error: "Sem sessão" }, { status: 401 });

  const form = await req.formData();

  const upstream = await fetch(`${API_BASE}/uploads/selfie`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${decodeURIComponent(token)}`,
      // NÃO setar Content-Type aqui (o fetch seta boundary)
    },
    body: form,
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
