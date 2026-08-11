"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";

const PROXY_URL = "https://ipctbyobohuikkhyymos.supabase.co/functions/v1/api-proxy";

type Instance = { name: string; api_token: string; evolution_instance_name: string };

export function DocsExamples({ instances }: { instances: Instance[] }) {
  const [selected, setSelected] = useState(0);

  if (instances.length === 0) {
    return (
      <p className="mt-4 text-sm text-neutral-500">
        No tienes instancias todavia. Crea una en la seccion Instancias para ver tus ejemplos con token.
      </p>
    );
  }

  const inst = instances[selected];
  const token = inst.api_token;

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

  return (
    <div>
      {/* Selector de instancia */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-neutral-300">Instancia</label>
        <div className="flex flex-wrap gap-2">
          {instances.map((i, idx) => (
            <button
              key={i.evolution_instance_name}
              onClick={() => setSelected(idx)}
              className={
                "rounded-lg px-4 py-2 text-sm font-medium transition " +
                (idx === selected
                  ? "bg-emerald-600 text-white"
                  : "border border-neutral-700 text-neutral-300 hover:bg-neutral-800")
              }
            >
              {i.name}
            </button>
          ))}
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-white">Tu token</h2>
        <p className="mb-3 text-sm text-neutral-400">
          Token de la instancia <span className="text-emerald-300">{inst.name}</span>. Usalo en el header <code className="text-emerald-300">x-api-token</code>.
        </p>
        <CodeBlock lang="Token" code={token} />
      </section>

      <section className="mb-8 space-y-6">
        <h2 className="text-xl font-semibold text-white">Enviar mensaje de texto</h2>
        <CodeBlock lang="cURL" code={curlText} />
        <CodeBlock lang="JavaScript" code={jsText} />
        <CodeBlock lang="Python" code={pyText} />
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-white">Enviar imagen</h2>
        <CodeBlock lang="cURL" code={imgText} />
      </section>
    </div>
  );
}