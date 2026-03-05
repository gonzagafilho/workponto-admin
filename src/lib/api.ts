// /src/lib/api.ts

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "") + "/api";

export function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "") + "/api";
}

export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("ADMIN_TOKEN") || "";
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ADMIN_TOKEN", token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("ADMIN_TOKEN");
}

export async function api(path: string, opts: RequestInit = {}) {
  const token = getAdminToken();
  const headers = new Headers(opts.headers || {});

  if (!headers.get("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", "Bearer " + token);

  const res = await fetch(API_BASE + path, { ...opts, headers });
  const text = await res.text();

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { ok: res.ok, status: res.status, data };
}