import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
const SUPABASE_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("DB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-token, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = req.headers.get("x-api-token");
  if (!token) return json({ error: "Missing x-api-token header" }, 401);

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Validar token -> instancia
  const { data: instance, error: instErr } = await db
    .from("instances")
    .select("id, evolution_instance_name, status")
    .eq("api_token", token)
    .single();

  if (instErr || !instance) { console.log("TOKEN_DEBUG:", JSON.stringify({ token, instErr, instance, url: Deno.env.get("SUPABASE_URL") })); return json({ error: "Invalid api_token", debug: instErr?.message ?? "no rows" }, 401); }

  const evoName = instance.evolution_instance_name;

  let payload: any;
  try { payload = await req.json(); }
  catch { return json({ error: "Invalid JSON body" }, 400); }

  const action = payload.action;
  if (!action) return json({ error: "Missing action" }, 400);

  // Helper: llama al motor Evolution
  async function evo(path: string, body: unknown) {
    const r = await fetch(`${EVOLUTION_URL}${path}`, {
      method: "POST",
      headers: { "apikey": EVOLUTION_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return { ok: r.ok, status: r.status, data };
  }

  // Helper: detectar grupo vs individual
  function destType(phone: string) {
    return phone.includes("@g.us") ? "group" : "individual";
  }

  // Helper: registrar en messages_log
  async function log(type: string, dest: string, result: any) {
    await db.from("messages_log").insert({
      instance_id: instance.id,
      evolution_message_id: result?.data?.key?.id ?? null,
      message_type: type,
      destination_type: destType(dest),
      destination: dest,
      status: result?.ok ? "PENDING" : "FAILED",
      raw_response: result?.data ?? null,
    });
  }

  // 2. Rutear accion
  switch (action) {
    case "send-text": {
      const { phone, message } = payload;
      if (!phone || !message) return json({ error: "phone and message required" }, 400);
      const result = await evo(`/message/sendText/${evoName}`, { number: phone, text: message });
      await log("text", phone, result);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "send-image": {
      const { phone, url, caption } = payload;
      if (!phone || !url) return json({ error: "phone and url required" }, 400);
      const result = await evo(`/message/sendMedia/${evoName}`, {
        number: phone, mediatype: "image", media: url, caption: caption ?? "",
      });
      await log("image", phone, result);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "send-file": {
      const { phone, url, fileName } = payload;
      if (!phone || !url) return json({ error: "phone and url required" }, 400);
      const result = await evo(`/message/sendMedia/${evoName}`, {
        number: phone, mediatype: "document", media: url, fileName: fileName ?? "file",
      });
      await log("document", phone, result);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "send-audio": {
      const { phone, url } = payload;
      if (!phone || !url) return json({ error: "phone and url required" }, 400);
      const result = await evo(`/message/sendWhatsAppAudio/${evoName}`, { number: phone, audio: url });
      await log("audio", phone, result);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "list-groups": {
      const r = await fetch(`${EVOLUTION_URL}/group/fetchAllGroups/${evoName}?getParticipants=false`, {
        headers: { "apikey": EVOLUTION_KEY },
      });
      const data = await r.json();
      return json(data, r.ok ? 200 : r.status);
    }
    case "instance-status": {
      const r = await fetch(`${EVOLUTION_URL}/instance/connectionState/${evoName}`, {
        headers: { "apikey": EVOLUTION_KEY },
      });
      const data = await r.json();
      return json(data, r.ok ? 200 : r.status);
    }
    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }
});
