import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminMerchantsTable } from "./AdminMerchantsTable";
import type { Merchant } from "@/lib/types";

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">Admin — Roue Fidélité</h1>
          <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Dashboard
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <AdminMerchantsTable merchants={(merchants ?? []) as Merchant[]} />
      </main>
    </div>
  );
}
