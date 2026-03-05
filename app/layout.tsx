import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "./_components/Sidebar";
import { SidebarProvider } from "./_components/SidebarContext";

export const metadata: Metadata = {
  title: "SmartPonto — Ponto com geolocalização e selfie",
  description:
    "Controle de ponto profissional para equipes em obra e campo. Geofence por obra, selfie antifraude, modo offline e painel multiempresa.",
};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#F5F6F8] text-[#111111] flex">
        <SidebarProvider>
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-10">
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}