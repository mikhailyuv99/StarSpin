"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/client";

export function SignOutButton() {
  const router = useRouter();
  const t = useTranslations();

  const handleSignOut = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-[13px] font-medium text-muted hover:text-ink"
    >
      {t("common.signOut")}
    </button>
  );
}
