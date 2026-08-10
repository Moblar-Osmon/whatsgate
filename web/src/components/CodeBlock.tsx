"use client";

import { useState } from "react";

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="text-xs font-medium uppercase text-neutral-500">{lang}</span>
        <button
          onClick={copy}
          className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-300 transition hover:bg-neutral-700"
        >
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-neutral-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}