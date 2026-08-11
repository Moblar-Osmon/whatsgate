import { createClient } from "@/lib/supabase/server";
import { DocsExamples } from "@/components/DocsExamples";

export default async function DocsPage() {
  const supabase = await createClient();
  const { data: instances } = await supabase
    .from("instances")
    .select("name, api_token, evolution_instance_name")
    .order("created_at");

  const actions = [
    ["send-text", "Enviar texto", "phone, message"],
    ["send-image", "Enviar imagen", "phone, url, caption"],
    ["send-file", "Enviar archivo", "phone, url, fileName"],
    ["send-audio", "Enviar audio", "phone, url"],
    ["list-groups", "Listar grupos", "(ninguno)"],
    ["instance-status", "Estado de instancia", "(ninguno)"],
  ];

  return (
    <div className="p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Documentacion API</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Integra WhatsGate en tus automatizaciones. Elige una instancia y copia los ejemplos con su token.
        </p>

        <section className="mt-8">
          <h2 className="mb-2 text-xl font-semibold">Acciones disponibles</h2>
          <div className="overflow-hidden rounded-xl border border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900 text-neutral-400">
                <tr>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Descripcion</th>
                  <th className="px-4 py-2">Parametros</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a[0]} className="border-t border-neutral-800">
                    <td className="px-4 py-2 font-mono text-emerald-300">{a[0]}</td>
                    <td className="px-4 py-2 text-neutral-300">{a[1]}</td>
                    <td className="px-4 py-2 text-neutral-500">{a[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8">
          <DocsExamples instances={instances ?? []} />
        </div>

        <section className="mt-8 rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
          <h3 className="font-semibold text-amber-300">Grupos</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Para enviar a un grupo, usa el Group JID (formato <code className="text-emerald-300">120363...@g.us</code>) en el campo <code className="text-emerald-300">phone</code>. Obtenlo con la accion <code className="text-emerald-300">list-groups</code>.
          </p>
        </section>
      </div>
    </div>
  );
}