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

async function evoGet(path: string) {
  const r = await fetch(`${EVOLUTION_URL}${path}`, { headers: { "apikey": EVOLUTION_KEY } });
  return { ok: r.ok, status: r.status, data: await r.json() };
}
async function evoPost(path: string, body: unknown) {
  const r = await fetch(`${EVOLUTION_URL}${path}`, {
    method: "POST",
    headers: { "apikey": EVOLUTION_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, data: await r.json() };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let payload: any;
  try { payload = await req.json(); }
  catch { return json({ error: "Invalid JSON body" }, 400); }
  const action = payload.action;
  if (!action) return json({ error: "Missing action" }, 400);

  // ===== ACCIONES ADMIN (requieren JWT del usuario logueado) =====
  const adminActions = ["create-instance", "get-qr", "list-instances", "delete-instance", "sync-status"];
  if (adminActions.includes(action)) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization" }, 401);
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: uErr } = await db.auth.getUser(jwt);
    if (uErr || !user) return json({ error: "Invalid session" }, 401);

    switch (action) {
            case "sync-status": {
        const { data: userInstances } = await db.from("instances").select("id, evolution_instance_name").eq("user_id", user.id);
        for (const inst of userInstances ?? []) {
          const st = await evoGet(`/instance/connectionState/${inst.evolution_instance_name}`);
          const state = st.data?.instance?.state;
          if (state) {
            const mapped = state === "open" ? "connected" : state === "connecting" ? "connecting" : "disconnected";
            const patch: any = { status: mapped };
            const fetchInst = await evoGet(`/instance/fetchInstances?instanceName=${inst.evolution_instance_name}`);
            const num = Array.isArray(fetchInst.data) ? fetchInst.data[0]?.ownerJid?.split("@")[0] : null;
            if (num) patch.phone_number = num;
            await db.from("instances").update(patch).eq("id", inst.id);
          }
        }
        const { data: updated } = await db.from("instances").select("*").eq("user_id", user.id).order("created_at");
        return json({ instances: updated ?? [] });
      }
      case "list-instances": {
        const { data } = await db.from("instances").select("*").eq("user_id", user.id).order("created_at");
        return json({ instances: data ?? [] });
      }
      case "create-instance": {
        const { name } = payload;
        if (!name) return json({ error: "name required" }, 400);
        const evoName = (name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).slice(2, 7));
        const result = await evoPost("/instance/create", {
          instanceName: evoName, qrcode: true, integration: "WHATSAPP-BAILEYS",
        });
        if (!result.ok) return json({ error: "Evolution error", detail: result.data }, result.status);
        const { data: inst, error: insErr } = await db.from("instances").insert({
          user_id: user.id, name, evolution_instance_name: evoName, status: "connecting",
        }).select("id, name, api_token, evolution_instance_name").single();
        if (insErr) return json({ error: "DB error", detail: insErr.message }, 500);
        const qr = result.data?.qrcode?.base64 ?? null;
        return json({ instance: inst, qrcode: qr });
      }
      case "get-qr": {
        const { evolution_instance_name } = payload;
        if (!evolution_instance_name) return json({ error: "evolution_instance_name required" }, 400);
        const { data: owned } = await db.from("instances").select("id").eq("user_id", user.id).eq("evolution_instance_name", evolution_instance_name).single();
        if (!owned) return json({ error: "Not found" }, 404);
        const result = await evoGet(`/instance/connect/${evolution_instance_name}`);
        return json(result.data, result.ok ? 200 : result.status);
      }
      case "delete-instance": {
        const { evolution_instance_name } = payload;
        const { data: owned } = await db.from("instances").select("id").eq("user_id", user.id).eq("evolution_instance_name", evolution_instance_name).single();
        if (!owned) return json({ error: "Not found" }, 404);
        await evoPost(`/instance/delete/${evolution_instance_name}`, {});
        await db.from("instances").delete().eq("id", owned.id);
        return json({ deleted: true });
      }
    }
  }

  // ===== ACCIONES DE ENVIO (requieren x-api-token) =====
  const token = req.headers.get("x-api-token");
  if (!token) return json({ error: "Missing x-api-token header" }, 401);

  const { data: instance, error: instErr } = await db
    .from("instances").select("id, evolution_instance_name, status").eq("api_token", token).single();
  if (instErr || !instance) return json({ error: "Invalid api_token" }, 401);

  const evoName = instance.evolution_instance_name;

  function destType(phone: string) { return phone.includes("@g.us") ? "group" : "individual"; }
  async function logMsg(type: string, dest: string, result: any) {
    await db.from("messages_log").insert({
      instance_id: instance.id,
      evolution_message_id: result?.data?.key?.id ?? null,
      message_type: type, destination_type: destType(dest), destination: dest,
      status: result?.ok ? "PENDING" : "FAILED", raw_response: result?.data ?? null,
    });
  }

  switch (action) {
    case "send-text": {
      const { phone, message } = payload;
      if (!phone || !message) return json({ error: "phone and message required" }, 400);
      const result = await evoPost(`/message/sendText/${evoName}`, { number: phone, text: message });
      await logMsg("text", phone, result);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "send-image": {
      const { phone, url, caption } = payload;
      if (!phone || !url) return json({ error: "phone and url required" }, 400);
      const result = await evoPost(`/message/sendMedia/${evoName}`, { number: phone, mediatype: "image", media: url, caption: caption ?? "" });
      await logMsg("image", phone, result);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "send-file": {
      const { phone, url, fileName } = payload;
      if (!phone || !url) return json({ error: "phone and url required" }, 400);
      const result = await evoPost(`/message/sendMedia/${evoName}`, { number: phone, mediatype: "document", media: url, fileName: fileName ?? "file" });
      await logMsg("document", phone, result);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "send-audio": {
      const { phone, url } = payload;
      if (!phone || !url) return json({ error: "phone and url required" }, 400);
      const result = await evoPost(`/message/sendWhatsAppAudio/${evoName}`, { number: phone, audio: url });
      await logMsg("audio", phone, result);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "list-groups": {
      const result = await evoGet(`/group/fetchAllGroups/${evoName}?getParticipants=false`);
      return json(result.data, result.ok ? 200 : result.status);
    }
    case "instance-status": {
      const result = await evoGet(`/instance/connectionState/${evoName}`);
      return json(result.data, result.ok ? 200 : result.status);
    }
    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }
});