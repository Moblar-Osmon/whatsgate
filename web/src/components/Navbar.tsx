import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/instances", label: "Instancias" },
    { href: "/docs", label: "Docs API" },
  ];

  return (
    <nav className="border-b border-neutral-800 bg-neutral-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-white">
            WhatsGate
          </Link>
          <div className="flex gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-neutral-400 transition hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-400 sm:block">{user.email}</span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}