"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROXY_URL = "https://ipctbyobohuikkhyymos.supabase.co/functions/v1/api-proxy";

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function sync() {
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action: "sync-status" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={sync}
      disabled={loading}
      className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-white disabled:opacity-50"
    >
      {loading ? "Sincronizando..." : "Sincronizar estado"}
    </button>
  );
}