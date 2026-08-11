"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROXY_URL = "https://ipctbyobohuikkhyymos.supabase.co/functions/v1/api-proxy";

export function AddInstance() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [evoName, setEvoName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  async function callProxy(body: object) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    const data = await callProxy({ action: "create-instance", name });
    setLoading(false);
    if (data.error) {
      setError(data.error + (data.detail ? ": " + JSON.stringify(data.detail) : ""));
      return;
    }
    setEvoName(data.instance?.evolution_instance_name ?? null);
    setQr(data.qrcode ?? null);
  }

  // Polling: cada 3s revisa si ya conecto
  useEffect(() => {
    if (!evoName || connected) return;
    const interval = setInterval(async () => {
      const data = await callProxy({ action: "get-qr", evolution_instance_name: evoName });
      if (data?.instance?.state === "open" || data?.state === "open") {
        setConnected(true);
        clearInterval(interval);
        router.refresh();
      } else if (data?.base64) {
        setQr(data.base64);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [evoName, connected]);

  function reset() {
    setOpen(false); setName(""); setQr(null); setEvoName(null); setError(null); setConnected(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
      >
        + Agregar instancia
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Agregar instancia</h3>
              <button onClick={reset} className="text-neutral-400 hover:text-white">âœ•</button>
            </div>

            {!qr && !connected && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-neutral-300">Nombre de la instancia</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Ventas, Soporte, Cliente 2"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  onClick={handleCreate}
                  disabled={loading || !name}
                  className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? "Creando..." : "Crear y generar QR"}
                </button>
              </div>
            )}

            {qr && !connected && (
              <div className="text-center">
                <p className="mb-3 text-sm text-neutral-300">
                  Escanea con WhatsApp del numero nuevo:<br />
                  <span className="text-neutral-500">Ajustes / Dispositivos vinculados / Vincular</span>
                </p>
                <img src={qr.startsWith("data:") ? qr : "data:image/png;base64," + qr} alt="QR" className="mx-auto rounded-lg bg-white p-2" width={240} height={240} />
                <p className="mt-3 text-xs text-neutral-500">Esperando conexion...</p>
              </div>
            )}

            {connected && (
              <div className="text-center">
                <p className="text-emerald-400">Instancia conectada!</p>
                <button onClick={reset} className="mt-4 rounded-lg bg-neutral-700 px-4 py-2 text-sm text-white hover:bg-neutral-600">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}