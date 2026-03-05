"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getAdminToken, clearAdminToken } from "../src/lib/api";
import Topbar from "./_components/Topbar";
import DashboardChart from "./_components/DashboardChart";

type Metrics = {
  tenantsActive?: number;
  employeesActive?: number;
  timeEntriesToday?: number;
  revenueMonthlyEstimated?: number;

  // opcional (vamos popular no backend depois)
  riskLevel?: "low" | "medium" | "high";
  weeklyHours?: Array<{ name: string; value: number }>;

  [k: string]: any;
};

function formatBRL(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [err, setErr] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  async function load() {
  setRefreshing(true);
  setErr("");
  setLoading(true);

  const token = getAdminToken();
  if (!token) {
    router.replace("/login");
    return;
  }

  const res = await api("/dashboard/metrics");

  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      router.replace("/login");
      return;
    }
    setErr(res.data?.message || "Falha ao carregar métricas");
    setLoading(false);
    setRefreshing(false);
    return;
  }

  const payload = res.data?.data ?? res.data;
  setMetrics(payload || null);
  setLastUpdated(
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );

  setLoading(false);
  setRefreshing(false);
}

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📊 Dados do gráfico (fallback caso backend ainda não mande)
  const chartData =
    metrics?.weeklyHours?.length
      ? metrics.weeklyHours
      : [
          { name: "Seg", value: 0 },
          { name: "Ter", value: 0 },
          { name: "Qua", value: 0 },
          { name: "Qui", value: 0 },
          { name: "Sex", value: 0 },
          { name: "Sáb", value: 0 },
          { name: "Dom", value: 0 },
        ];

  const cards = useMemo(() => {
    const m = metrics || {};
    return [
      { label: "Tenants ativos", value: m.tenantsActive ?? "—" },
      { label: "Funcionários ativos", value: m.employeesActive ?? "—" },
      { label: "Registros hoje", value: m.timeEntriesToday ?? "—" },
      { label: "Receita mensal estimada", value: formatBRL(m.revenueMonthlyEstimated) },
    ];
  }, [metrics]);

  const showDebug = process.env.NEXT_PUBLIC_SHOW_DEBUG === "1";

  function renderRiskBadge() {
    const level = metrics?.riskLevel ?? "medium";

    const label =
      level === "low"
        ? "Risco baixo"
        : level === "high"
        ? "Risco alto"
        : "Risco moderado";
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-900">
        {level === "high" ? "⚠" : "✓"} {label}
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Topbar
        title="Dashboard Global"
        subtitle="Visão geral do SmartPonto (Admin Global)."
        right={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={load}
              disabled={refreshing}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
            >
              {refreshing ? "Atualizando..." : "Atualizar"}
            </button>

            <button
              onClick={() => router.push("/tenants")}
              className="w-full rounded-xl border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black sm:w-auto"
            >
              Gerenciar tenants
            </button>
          </div>
        }
      />

      {err ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900">
          {err}
        </div>
      ) : null}

      {/* Cards principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
          >
            <p className="text-sm text-gray-600">{c.label}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:mt-3 sm:text-3xl">
              {loading ? "…" : c.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Status (REAL) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 sm:px-4 sm:py-2">
          Última atualização:{" "}
          <span className="font-mono text-gray-900">{lastUpdated || "—"}</span>
        </div>
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Gráfico */}
        <div className="xl:col-span-2 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Horas registradas na semana
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Visual rápido de volume de ponto (sem poluição).
              </p>
            </div>
          </div>

          <div className="mt-6">
            <DashboardChart data={chartData} />
          </div>
        </div>

        {/* Risco + valor comercial */}
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-gray-900">Indicador estratégico</h3>

          <div className="mt-4">{renderRiskBadge()}</div>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:mt-6">
            <p className="text-sm font-semibold text-gray-900">O que isso resolve:</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Fechamento mensal automático</li>
              <li>• Controle de inconsistências</li>
              <li>• Redução de risco trabalhista</li>
              <li>• Gestão multiempresa SaaS</li>
            </ul>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                clearAdminToken();
                router.replace("/login");
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
            >
              Sair do sistema
            </button>
          </div>
        </div>
      </div>

      {showDebug ? (
        <details className="rounded-2xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">
            Dados brutos (debug)
          </summary>
          <div className="mt-4 overflow-auto rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <pre className="text-xs text-gray-900">
              {loading ? "Carregando..." : JSON.stringify(metrics, null, 2)}
            </pre>
          </div>
        </details>
      ) : null}
    </div>
  );
}