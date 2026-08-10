import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: instances } = await supabase
    .from("instances")
    .select("id, name, status, phone_number");

  const instanceIds = (instances ?? []).map((i) => i.id);

  let messages: { message_type: string; sent_at: string }[] = [];
  if (instanceIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages_log")
      .select("message_type, sent_at")
      .in("instance_id", instanceIds);
    messages = msgs ?? [];
  }

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const total = messages.length;
  const today = messages.filter((m) => new Date(m.sent_at) >= startToday).length;
  const week = messages.filter((m) => new Date(m.sent_at) >= last7).length;
  const activeInstances = (instances ?? []).filter((i) => i.status === "connected").length;

  const cards = [
    { label: "Total enviados", value: total },
    { label: "Hoy", value: today },
    { label: "Ultimos 7 dias", value: week },
    { label: "Instancias activas", value: activeInstances },
  ];

  return (
    <div className="p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">Resumen de tu cuenta de WhatsGate</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <p className="text-sm text-neutral-400">{c.label}</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Mis instancias</h2>
          <div className="space-y-2">
            {(instances ?? []).length === 0 && (
              <p className="text-sm text-neutral-500">Aun no tienes instancias.</p>
            )}
            {(instances ?? []).map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <div>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-sm text-neutral-400">{i.phone_number ?? "Sin numero"}</p>
                </div>
                <span className={"rounded-full px-3 py-1 text-xs font-medium " + (i.status === "connected" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-700 text-neutral-300")}>
                  {i.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}