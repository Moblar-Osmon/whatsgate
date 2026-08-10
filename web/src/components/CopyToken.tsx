"use client";

import { useState } from "react";

export function CopyToken({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg bg-neutral-800 px-3 py-2 text-sm text-emerald-300">
        {token}
      </code>
      <button
        onClick={copy}
        className="rounded-lg bg-neutral-700 px-3 py-2 text-sm text-white transition hover:bg-neutral-600"
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}