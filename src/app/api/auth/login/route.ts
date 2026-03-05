import { NextResponse } from "next/server";

const API_BASE =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3011";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // Proxy para a API (Nest)
  const upstream = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok || !data?.accessToken) {
    return NextResponse.json(
      { ok: false, error: data?.message || data?.error || "Login inválido" },
      { status: 401 }
    );
  }

  // Cookie HttpOnly (o middleware lê wp_access)
  const res = NextResponse.json({ ok: true, user: data?.user || null });

  res.cookies.set("wp_access", data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: true, // em produção HTTPS
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return res;
}