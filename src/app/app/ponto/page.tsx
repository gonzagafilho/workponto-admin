"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Worksite = {
  id: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  requireSelfie: boolean;
};

type PunchType = "IN" | "LUNCH_OUT" | "LUNCH_IN" | "OUT";

const EMPLOYEE_ID_KEY = "wp_employee_id";

function toRad(n: number) {
  return (n * Math.PI) / 180;
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * (s2 * s2);
  return 2 * R * Math.asin(Math.sqrt(aa));
}

export default function PontoPage() {
  const [works, setWorks] = useState<Worksite[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [siteId, setSiteId] = useState("");

  const selected = useMemo(
    () => works.find((w) => w.id === siteId) || null,
    [works, siteId],
  );

  const [type, setType] = useState<PunchType>("IN");

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingPos, setGettingPos] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string>("");

  async function loadWorksites() {
    setLoadingWorks(true);
    setErr(null);
    try {
      const res = await fetch("/api/worksites", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Falha ao carregar obras");

      const list = Array.isArray(data) ? data : data?.data || data?.items || [];
      setWorks(list);
      if (!siteId && list?.[0]?.id) setSiteId(list[0].id);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar obras");
    } finally {
      setLoadingWorks(false);
    }
  }

  async function getLocation() {
    setGettingPos(true);
    setErr(null);
    try {
      const p = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
    } catch (e: any) {
      setErr(e?.message || "Não foi possível obter localização");
    } finally {
      setGettingPos(false);
    }
  }

  async function startCamera() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setErr(e?.message || "Não foi possível abrir a câmera");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function takeSelfie() {
    setErr(null);
    const v = videoRef.current;
    if (!v) return;

    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 720;
    canvas.height = v.videoHeight || 1280;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );

    if (!blob) {
      setErr("Falha ao capturar selfie");
      return;
    }

    setSelfieBlob(blob);
    stopCamera();
  }

  const distanceInfo = useMemo(() => {
    if (!selected || !pos) return null;
    const d = haversineMeters(pos.lat, pos.lng, selected.latitude, selected.longitude);
    const inside = d <= (selected.radiusMeters || 0);
    return { meters: d, inside };
  }, [selected, pos]);

  async function uploadSelfieIfNeeded(): Promise<string> {
    if (!selected?.requireSelfie) return "";
    if (!selfieBlob) throw new Error("Selfie obrigatória neste local");
    if (!employeeId) throw new Error("employeeId é obrigatório para upload da selfie");

    const form = new FormData();
    form.append("employeeId", employeeId);
    form.append("file", selfieBlob, "selfie.jpg");

    const up = await fetch("/api/uploads/selfie", { method: "POST", body: form });
    const upData = await up.json().catch(() => ({}));
    if (!up.ok || !upData?.selfieUrl) {
      throw new Error(upData?.message || upData?.error || "Falha no upload da selfie");
    }
    return upData.selfieUrl as string;
  }

  async function baterPonto() {
    setSending(true);
    setErr(null);
    setResult(null);

    try {
      if (!employeeId) throw new Error("Informe employeeId");
      if (!siteId) throw new Error("Selecione uma obra (siteId)");
      if (!pos) throw new Error("Pegue a localização antes");
      if (!distanceInfo) throw new Error("Distância não calculada");
      if (!distanceInfo.inside) throw new Error("Fora do raio permitido (geofence)");

      const url = await uploadSelfieIfNeeded();
      if (url) setSelfieUrl(url);

      const payload = {
        employeeId,
        siteId,
        type,
        latitude: pos.lat,
        longitude: pos.lng,
        selfieUrl: url || undefined,
      };

      const punch = await fetch("/api/timeentries/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const punchData = await punch.json().catch(() => ({}));
      if (!punch.ok || !punchData?.ok) {
        throw new Error(punchData?.message || punchData?.error || "Falha ao bater ponto");
      }

      setResult(punchData);
    } catch (e: any) {
      setErr(e?.message || "Erro ao bater ponto");
    } finally {
      setSending(false);
    }
  }

  // carrega obras + encerra câmera
  useEffect(() => {
    loadWorksites();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // carrega employeeId salvo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMPLOYEE_ID_KEY);
      if (saved && !employeeId) setEmployeeId(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // salva employeeId
  useEffect(() => {
    try {
      if (employeeId) localStorage.setItem(EMPLOYEE_ID_KEY, employeeId);
    } catch {}
  }, [employeeId]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="text-xl font-semibold">Bater Ponto (MVP)</div>
        <div className="text-sm text-neutral-600">Geofence + Selfie + Sequência</div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-medium">1) Funcionário</div>
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="employeeId (por enquanto)"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <div className="text-xs text-neutral-500">
          Por enquanto o punch exige employeeId. Depois trocamos para login por CPF do funcionário.
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-medium">2) Tipo de batida</div>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value as PunchType)}
        >
          <option value="IN">IN (Entrada)</option>
          <option value="LUNCH_OUT">LUNCH_OUT (Saída almoço)</option>
          <option value="LUNCH_IN">LUNCH_IN (Volta almoço)</option>
          <option value="OUT">OUT (Saída)</option>
        </select>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-medium">3) Obra (Worksite)</div>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          disabled={loadingWorks}
        >
          {works.map((w) => (
            <option key={w.id} value={w.id}>
              {(w.name || "Obra")} — raio {w.radiusMeters}m {w.requireSelfie ? "— selfie" : ""}
            </option>
          ))}
        </select>

        {selected && (
          <div className="text-sm text-neutral-600">
            Pin: {selected.latitude}, {selected.longitude} — raio {selected.radiusMeters}m — selfie:{" "}
            {selected.requireSelfie ? "SIM" : "NÃO"}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-medium">4) Localização</div>
        <button
          onClick={getLocation}
          disabled={gettingPos}
          className="rounded-xl bg-black px-3 py-2 text-white disabled:opacity-60"
        >
          {gettingPos ? "Pegando..." : "Pegar localização"}
        </button>

        {pos && (
          <div className="text-sm text-neutral-700">
            Você: {pos.lat}, {pos.lng}
            {distanceInfo && (
              <div>
                Distância: {Math.round(distanceInfo.meters)}m — <b>{distanceInfo.inside ? "DENTRO" : "FORA"}</b>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-medium">5) Selfie</div>
        {selected?.requireSelfie ? (
          <>
            {!selfieBlob ? (
              <div className="space-y-3">
                <button onClick={startCamera} className="rounded-xl border px-3 py-2">
                  Abrir câmera
                </button>
                <div className="rounded-xl overflow-hidden border">
                  <video ref={videoRef} className="w-full" playsInline />
                </div>
                <button onClick={takeSelfie} className="rounded-xl bg-black px-3 py-2 text-white">
                  Tirar selfie
                </button>
              </div>
            ) : (
              <div className="text-sm text-neutral-700">
                Selfie capturada ✅{" "}
                <button className="underline" onClick={() => setSelfieBlob(null)}>
                  refazer
                </button>
                {selfieUrl ? <div className="text-xs text-neutral-500">selfieUrl: {selfieUrl}</div> : null}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-neutral-600">Nesta obra, selfie não é obrigatória.</div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-medium">6) Bater ponto</div>
        <button
          onClick={baterPonto}
          disabled={sending}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-white disabled:opacity-60"
        >
          {sending ? "Enviando..." : "Bater ponto agora"}
        </button>

        {result && (
          <pre className="text-xs whitespace-pre-wrap rounded-xl border bg-neutral-50 p-3">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}