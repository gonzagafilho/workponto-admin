"use client";

import { useRouter } from "next/navigation";
import Topbar from "../_components/Topbar";
import { clearAdminToken } from "../../src/lib/api";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <Topbar
        title="Configurações"
        subtitle="Preferências do Admin Global e informações do sistema."
        right={
          <button
            onClick={() => {
              clearAdminToken();
              router.replace("/login");
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
          >
            Sair
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conta */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Conta (Admin Global)</h2>
              <p className="mt-1 text-sm text-gray-600">
                Dados básicos do administrador e acesso ao painel.
              </p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
               Online
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">E-mail</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                dc.net.infinity@gmail.com
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Permissões</div>
              <div className="mt-1 text-sm text-gray-700">
                Acesso total a tenants, configurações e métricas globais.
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">Em breve: editar perfil, trocar senha e 2FA.</p>
        </div>

        {/* Sistema */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Status do sistema</h2>
          <p className="mt-1 text-sm text-gray-600">Visão rápida para suporte e operação.</p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div>
                <div className="text-xs font-semibold text-gray-500">Ambiente</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">Produção</div>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Online
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Backend (API)</div>
              <div className="mt-1 text-sm text-gray-700">
                Em breve: health check automático e latência.
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Armazenamento</div>
              <div className="mt-1 text-sm text-gray-700">
                Em breve: uso de disco, uploads e alertas.
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Próximo upgrade: página de “Monitoramento” (SLA, erros e auditoria).
          </p>
        </div>

        {/* Branding */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Branding</h2>
          <p className="mt-1 text-sm text-gray-600">
            Personalização do painel por tenant (logo, cores e nome).
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Tema</div>
              <div className="mt-1 text-sm text-gray-700">
                Minimalista premium (base branca).
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Cores</div>
              <div className="mt-1 text-sm text-gray-700">
               Base branca (#FFFFFF) + cinzas premium + tipografia preta (alertas só em verde/vermelho).
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Configuração</div>
              <div className="mt-1 text-sm text-gray-700">
                Em breve: editor de marca + upload de logo.
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Isso vira diferencial comercial: painel “com a cara do cliente”.
          </p>
        </div>
      </div>
    </div>
  );
}