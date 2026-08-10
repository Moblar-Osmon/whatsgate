"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
    >
      Cerrar sesion
    </button>
  );
}