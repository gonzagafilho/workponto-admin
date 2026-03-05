"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearAdminToken, getAdminToken, getApiBase } from "../../src/lib/api";
import Topbar from "../_components/Topbar";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  isActive?: boolean;
};

export default function TenantsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [err, setErr] = useState<string>("");

  // create tenant
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // actions loading
  const [busyId, setBusyId] = useState<string | null>(null);

  // 🔎 Busca
  const [search, setSearch] = useState("");

  // reset password modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTenant, setResetTenant] = useState<Tenant | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const showDebug = process.env.NEXT_PUBLIC_SHOW_DEBUG === "1";

  // Fechamento mensal
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [fechamentoMonth, setFechamentoMonth] = useState(defaultMonth);
  const [fechamentoTenantId, setFechamentoTenantId] = useState("");
  const [closeBusy, setCloseBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canCreate = useMemo(() => {
    return tenantName && tenantSlug && adminName && adminEmail && adminPassword;
  }, [tenantName, tenantSlug, adminName, adminEmail, adminPassword]);

  // 🔎 Filtro de busca (fora de funções)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;

    return tenants.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.slug || "").toLowerCase().includes(q)
    );
  }, [search, tenants]);

  async function load() {
    setErr("");
    setLoading(true);

    const token = getAdminToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const res = await api("/admin/tenants");
    if (!res.ok) {
      if (res.status === 401) {
        clearAdminToken();
        router.replace("/login");
        return;
      }
      setErr(res.data?.message || "Falha ao carregar tenants");
      setLoading(false);
      return;
    }

    setTenants(res.data.tenants || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleCloseMonth() {
    if (!fechamentoTenantId?.trim()) {
      setToast({ type: "error", message: "Selecione um tenant." });
      return;
    }
    setErr("");
    setCloseBusy(true);
    const res = await api("/admin/reports/monthly-summary/close-month", {
      method: "POST",
      body: JSON.stringify({ yearMonth: fechamentoMonth, tenantId: fechamentoTenantId }),
    });
    setCloseBusy(false);
    if (!res.ok) {
      setToast({ type: "error", message: res.data?.message || "Falha ao fechar mês." });
      return;
    }
    setToast({ type: "success", message: `Mês ${res.data?.month ?? fechamentoMonth} fechado.` });
  }

  async function handleDownloadPdf() {
    if (!fechamentoTenantId?.trim()) {
      setToast({ type: "error", message: "Selecione um tenant." });
      return;
    }
    setErr("");
    setPdfBusy(true);
    const token = getAdminToken();
    const url = `${getApiBase()}/admin/reports/monthly-summary/pdf?month=${encodeURIComponent(fechamentoMonth)}&tenantId=${encodeURIComponent(fechamentoTenantId)}`;
    try {
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        setToast({ type: "error", message: "Falha ao gerar PDF." });
        setPdfBusy(false);
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `resumo-mensal-${fechamentoMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
      setToast({ type: "success", message: "PDF baixado." });
    } catch {
      setToast({ type: "error", message: "Erro ao baixar PDF." });
    }
    setPdfBusy(false);
  }

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const payload = {
      tenantName,
      tenantSlug,
      adminName,
      adminEmail,
      adminPassword,
    };

    const res = await api("/admin/tenants", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setErr(res.data?.message || "Falha ao criar tenant");
      return;
    }

    setTenantName("");
    setTenantSlug("");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");

    await load();
  }

  function logout() {
    clearAdminToken();
    router.replace("/login");
  }

  // ✅ Toggle isActive
  async function setTenantActive(tenantId: string, isActive: boolean) {
    setErr("");
    setBusyId(tenantId);

    if (!isActive) {
      const ok = confirm(
        "Tem certeza que deseja DESATIVAR este tenant? Isso vai bloquear login do cliente."
      );
      if (!ok) {
        setBusyId(null);
        return;
      }
    }

    const res = await api(`/admin/tenants/${tenantId}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });

    setBusyId(null);

    if (!res.ok) {
      setErr(res.data?.message || "Falha ao atualizar status do tenant");
      return;
    }

    const updated = res.data?.data;
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId ? { ...t, isActive: updated?.isActive ?? isActive } : t
      )
    );
  }

  // ✅ Reset admin password
  function openReset(t: Tenant) {
    setResetTenant(t);
    setNewPassword("");
    setResetOpen(true);
  }

  function closeReset() {
    setResetOpen(false);
    setResetTenant(null);
    setNewPassword("");
    setResetBusy(false);
  }

  async function submitReset() {
    if (!resetTenant) return;

    if (!newPassword || newPassword.length < 8) {
      setErr("A senha precisa ter no mínimo 8 caracteres.");
      return;
    }

    setErr("");
    setResetBusy(true);

    const res = await api(
      `/admin/tenants/${resetTenant.id}/reset-admin-password`,
      {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      }
    );

    setResetBusy(false);

    if (!res.ok) {
      setErr(res.data?.message || "Falha ao resetar senha do admin do tenant");
      return;
    }

    closeReset();
  }

  return (
    <div className="space-y-8">
      {/* TOP BAR */}
      <Topbar
        title="Tenants"
        subtitle="Empresas cadastradas no SmartPonto (Admin Global)."
        right={
          <>
            <button
              onClick={load}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
            >
              Atualizar
            </button>

            <button
              onClick={logout}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
            >
              Sair
            </button>
          </>
        }
      />

      {/* ERROR */}
      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {/* TOAST */}
      {toast ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {/* GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LIST */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-black">Tenants cadastrados</h2>

             {showDebug ? (
              <div className="text-xs text-gray-600">
                Endpoint:{" "}
                <span className="font-mono text-gray-800">/api/admin/tenants</span>
              </div>
            ) : null}
          </div>

          {/* BUSCA + CONTADOR */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700">
              Total: <span className="font-semibold text-black">{tenants.length}</span>
              {search.trim() ? (
                <>
                  {" "}
                  • Filtrados:{" "}
                  <span className="font-semibold text-black">{filtered.length}</span>
                </>
              ) : null}
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou slug..."
              className="w-full sm:w-80 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-400"
            />
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="text-sm text-gray-600">Carregando...</div>
            ) : tenants.length === 0 ? (
              <div className="text-sm text-gray-600">Nenhum tenant encontrado.</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-600">Nenhum tenant corresponde à busca.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full min-w-[640px] text-[15px]">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide">
                        Nome
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide">
                        Slug
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide">
                        Criado
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide">
                        Ações
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((t) => {
                      const active = t.isActive ?? true;
                      const busy = busyId === t.id;

                      return (
                        <tr
                          key={t.id}
                          className="border-t border-gray-200 hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-5 font-semibold text-black">{t.name}</td>

                          <td className="px-4 py-5 font-mono text-gray-800">{t.slug}</td>

                          <td className="px-4 py-5 text-gray-800">
                            {new Date(t.createdAt).toLocaleString()}
                          </td>

                          <td className="px-4 py-5">
                            {active ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900">
                                <span className="h-2 w-2 rounded-full bg-green-700" />
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900">
                                <span className="h-2 w-2 rounded-full bg-gray-400" />
                                Inativo
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                disabled={busy}
                                onClick={() => setTenantActive(t.id, !active)}
                                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition border ${
                                  active
                                    ? "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                                    : "border-gray-900 bg-gray-900 text-white hover:bg-black"
                                } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                                title="Ativar/Desativar tenant"
                              >
                                {busy ? "Aguarde..." : active ? "Inativar" : "Ativar"}
                              </button>

                              <button
                                onClick={() => openReset(t)}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
                              >
                                Reset Senha Admin
                              </button>

                              <span className="hidden md:inline text-xs text-gray-400 font-mono">
                                {t.id}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* CREATE */}
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-lg font-extrabold text-black">Criar novo tenant</h2>
          <p className="mt-1 text-sm text-gray-700">
            Cria a empresa e já cria o usuário{" "}
            <span className="font-mono text-gray-900">TENANT_ADMIN</span>.
          </p>

          <form onSubmit={createTenant} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-black">Nome da empresa</label>
              <input
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-400"
                placeholder="Ex: Cliente Gamma"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Slug</label>
              <input
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-400"
                placeholder="cliente-x"
              />
              <div className="mt-2 text-xs text-gray-600">
                minúsculo, sem espaços (ex:{" "}
                <span className="font-mono text-gray-900">cliente-x</span>)
              </div>
            </div>

            <div className="pt-2 text-sm font-extrabold text-black">Admin do tenant</div>

            <div>
              <label className="text-sm font-semibold text-black">Nome</label>
              <input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-400"
                placeholder="Admin Cliente"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Email</label>
              <input
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-400"
                placeholder="admin@cliente.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-black">Senha</label>
              <input
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-400"
                placeholder="Senha forte..."
              />
            </div>

            <button
              disabled={!canCreate}
              className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                canCreate
                  ? "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Criar tenant
            </button>
          </form>
        </div>
      </div>

      {/* Fechamento Mensal */}
      <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
        <h2 className="text-lg font-extrabold text-black">Fechamento Mensal</h2>
        <p className="mt-1 text-sm text-gray-600">
          Fechar mês e baixar PDF do resumo para um tenant.
        </p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1">
            <label className="text-sm font-semibold text-black">Tenant</label>
            <select
              value={fechamentoTenantId}
              onChange={(e) => setFechamentoTenantId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-gray-400"
            >
              <option value="">Selecione o tenant</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="text-sm font-semibold text-black">Mês (YYYY-MM)</label>
            <input
              type="text"
              value={fechamentoMonth}
              onChange={(e) => setFechamentoMonth(e.target.value)}
              placeholder="2026-03"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCloseMonth}
              disabled={closeBusy}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                closeBusy
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-900 bg-gray-900 text-white hover:bg-black"
              }`}
            >
              {closeBusy ? "Aguarde..." : "Fechar mês"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfBusy}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                pdfBusy
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              {pdfBusy ? "Aguarde..." : "Baixar PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL RESET PASSWORD */}
      {resetOpen && resetTenant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-black">Reset senha do admin</h3>
                <p className="mt-1 text-sm text-gray-700">
                  Tenant: <span className="font-mono text-black">{resetTenant.slug}</span>
                </p>
              </div>

              <button
                onClick={closeReset}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
              >
                Fechar
              </button>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-black">
                Nova senha (mínimo 8)
              </label>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-400"
                placeholder="NovaSenhaForte@123"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={closeReset}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>

              <button
                onClick={submitReset}
                disabled={resetBusy || newPassword.length < 8}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  resetBusy || newPassword.length < 8
                    ? "border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border border-gray-900 bg-gray-900 text-white hover:bg-black"
                }`}
              >
                {resetBusy ? "Aguarde..." : "Resetar senha"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}