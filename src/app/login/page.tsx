"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAdminToken, clearAdminToken, getAdminToken } from "../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("dc.net.infinity@gmail.com");
  const [password, setPassword] = useState("Marilene0310");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const res = await api("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      setErr(res.data?.message || "Falha no login");
      return;
    }

    const token = res.data?.accessToken;
    if (!token) {
      setErr("Login OK, mas não veio accessToken.");
      return;
    }

    localStorage.setItem("ADMIN_TOKEN", token);
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl font-extrabold tracking-tight">SmartPonto Admin</h1>
        <p className="mt-1 text-sm text-slate-400">Login do Admin Global</p>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Senha</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-xs text-slate-500">
            Endpoint: <span className="font-mono text-slate-300">/api/admin/auth/login</span>
          </div>
        </form>
      </div>
    </div>
  );
}