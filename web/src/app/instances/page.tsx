import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CopyToken } from "@/components/CopyToken";

export default async function InstancesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: instances } = await supabase
    .from("instances")
    .select("id, name, evolution_instance_name, api_token, phone_number, status, webhook_url, expires_at")
    .order("created_at");

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis instancias</h1>
          <p className="mt-1 text-sm text-neutral-400">Gestiona tus conexiones de WhatsApp</p>
        </div>

        {(instances ?? []).length === 0 && (
          <p className="text-sm text-neutral-500">Aun no tienes instancias.</p>
        )}

        <div className="space-y-4">
          {(instances ?? []).map((i) => (
            <div key={i.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{i.name}</h2>
                  <p className="text-sm text-neutral-400">{i.phone_number ?? "Sin numero"}</p>
                </div>
                <span className={"rounded-full px-3 py-1 text-xs font-medium " + (i.status === "connected" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-700 text-neutral-300")}>
                  {i.status}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-300">API Token</p>
                <CopyToken token={i.api_token} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">Instancia (motor)</p>
                  <p className="text-neutral-300">{i.evolution_instance_name}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Webhook URL</p>
                  <p className="truncate text-neutral-300">{i.webhook_url ?? "No configurado"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}