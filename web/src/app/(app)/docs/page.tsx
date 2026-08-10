import { createClient } from "@/lib/supabase/server";
import { CodeBlock } from "@/components/CodeBlock";

const PROXY_URL = "https://TU-PROYECTO.supabase.co/functions/v1/api-proxy";

export default async function DocsPage() {
  const supabase = await createClient();
  const { data: instances } = await supabase
    .from("instances")
    .select("api_token, name")
    .limit(1);

  const token = instances?.[0]?.api_token ?? "TU_API_TOKEN";

  const curlText = `curl -X POST ${PROXY_URL} \\
  -H "x-api-token: ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "send-text",
    "phone": "5215512345678",
    "message": "Hola desde WhatsGate!"
  }'`;

  const jsText = `const res = await fetch("${PROXY_URL}", {
  method: "POST",
  headers: {
    "x-api-token": "${token}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "send-text",
    phone: "5215512345678",
    message: "Hola desde WhatsGate!",
  }),
});
const data = await res.json();`;

  const pyText = `import requests

res = requests.post(
    "${PROXY_URL}",
    headers={"x-api-token": "${token}"},
    json={
        "action": "send-text",
        "phone": "5215512345678",
        "message": "Hola desde WhatsGate!",
    },
)
print(res.json())`;

  const imgText = `curl -X POST ${PROXY_URL} \\
  -H "x-api-token: ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "send-image",
    "phone": "5215512345678",
    "url": "https://ejemplo.com/imagen.jpg",
    "caption": "Mi imagen"
  }'`;

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
          Integra WhatsGate en tus automatizaciones. Los ejemplos ya incluyen tu token.
        </p>

        <section className="mt-8">
          <h2 className="mb-2 text-xl font-semibold">Autenticacion</h2>
          <p className="mb-3 text-sm text-neutral-400">
            Todas las peticiones usan el header <code className="text-emerald-300">x-api-token</code> con tu token.
          </p>
          <CodeBlock lang="Tu token" code={token} />
        </section>

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

        <section className="mt-8 space-y-6">
          <h2 className="text-xl font-semibold">Enviar mensaje de texto</h2>
          <CodeBlock lang="cURL" code={curlText} />
          <CodeBlock lang="JavaScript" code={jsText} />
          <CodeBlock lang="Python" code={pyText} />
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Enviar imagen</h2>
          <CodeBlock lang="cURL" code={imgText} />
        </section>

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