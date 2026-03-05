import { NextResponse } from "next/server";

const API_BASE =
  (process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:3011") + "/api";

function readCookieToken(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)wp_access=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

// tenta vários endpoints comuns sem quebrar nada
async function tryUpstream(token: string, path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function GET(req: Request) {
  const token = readCookieToken(req);
  if (!token) return NextResponse.json({ ok: false, error: "Sem sessão" }, { status: 401 });

  // 1) auth/me
  {
    const { res, data } = await tryUpstream(token, "/auth/me");
    if (res.ok) return NextResponse.json({ ok: true, source: "auth/me", data }, { status: 200 });
  }

  // 2) employees/me
  {
    const { res, data } = await tryUpstream(token, "/employees/me");
    if (res.ok) return NextResponse.json({ ok: true, source: "employees/me", data }, { status: 200 });
  }

  // 3) fallback (não achou endpoint compatível)
  return NextResponse.json(
    { ok: false, error: "ME não disponível no backend (auth/me ou employees/me)" },
    { status: 404 }
  );
}