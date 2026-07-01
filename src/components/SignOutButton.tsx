"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button type="button" onClick={handleSignOut} className="text-sm text-gray-600 hover:text-gray-900">
      Déconnexion
    </button>
  );
}
