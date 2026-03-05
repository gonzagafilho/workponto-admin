"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";

function titleFromPath(path: string) {
  if (path === "/") return { title: "Dashboard", crumb: "Visão geral" };
  if (path.startsWith("/tenants")) return { title: "Tenants", crumb: "Empresas" };
  if (path.startsWith("/settings")) return { title: "Configurações", crumb: "Sistema" };
  return { title: "SmartPonto", crumb: "Admin" };
}

export default function Topbar({
  title,
  subtitle,
  right,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const pathname = usePathname();
  const { setSidebarOpen } = useSidebar();
  const auto = titleFromPath(pathname);

  const finalTitle = title ?? auto.title;
  const finalSubtitle = subtitle ?? "";
  const finalCrumb = auto.crumb;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Abrir menu"
            className="md:hidden rounded-xl border border-gray-200 bg-white p-2.5 text-gray-700 hover:bg-gray-50 shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        <div>
          <div className="text-xs text-gray-500">{finalCrumb}</div>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
            {finalTitle}
          </h1>

          {finalSubtitle ? (
            <div className="mt-1 text-sm text-gray-600">{finalSubtitle}</div>
          ) : null}
        </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">{right ? right : null}</div>
      </div>

      <div className="mt-4 h-px bg-gray-200" />
    </div>
  );
}