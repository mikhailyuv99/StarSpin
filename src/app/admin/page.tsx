import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminMerchantsTable } from "./AdminMerchantsTable";
import type { Merchant } from "@/lib/types";
import { ui } from "@/components/ui/styles";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) redirect("/dashboard");

  const { data: merchants } = await supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className={ui.page}>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
          <h1 className="text-sm font-semibold text-ink">Administration</h1>
          <Link href="/dashboard" className="text-[13px] font-medium text-muted hover:text-ink">
            Dashboard
          </Link>
        </div>
      </header>
      <main className={`${ui.shell} space-y-8`}>
        <div>
          <h2 className={ui.h1}>Commerces</h2>
          <p className={ui.muted}>Gestion des abonnements et accès.</p>
        </div>
        <AdminMerchantsTable merchants={(merchants ?? []) as Merchant[]} />
      </main>
    </div>
  );
}
