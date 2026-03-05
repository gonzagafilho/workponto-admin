"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAdminToken } from "../../src/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@workponto.com.br");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await api("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setErr(res.data?.message || "Falha no login");
        return;
      }

      setAdminToken(res.data.accessToken);
      router.replace("/tenants");
    } catch (e: any) {
      setErr(e?.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          <div className="mb-5">
            <h1 className="text-2xl font-extrabold tracking-tight">Admin Global</h1>
            <p className="mt-1 text-sm text-slate-400">Acesso do administrador do SaaS (WorkPonto).</p>
          </div>

          {err ? (
            <div className="mb-4 rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-200">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="admin@workponto.com.br"
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-slate-600"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-200">Senha</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-slate-600"
              />
              <div className="mt-2 text-xs text-slate-500">
                Endpoint: <span className="font-mono text-slate-300">/api/admin/auth/login</span>
              </div>
            </div>

            <button
              disabled={loading}
              className="mt-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-white transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 grid gap-2 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Ambiente</span>
              <span className="font-mono text-slate-300">ADMIN GLOBAL</span>
            </div>
            <div className="flex items-center justify-between">
              <span>App</span>
              <span className="font-mono text-slate-300">workponto-admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}