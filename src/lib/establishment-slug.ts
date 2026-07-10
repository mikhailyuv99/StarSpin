import type { SupabaseClient } from "@supabase/supabase-js";
import { RESERVED_SLUGS } from "@/lib/app-url";

export async function pickAvailableSlug(
  supabase: SupabaseClient,
  base: string,
): Promise<string | null> {
  let candidate = base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (RESERVED_SLUGS.has(candidate)) {
      candidate = `${base}-${attempt + 2}`;
      continue;
    }
    const { data } = await supabase.from("merchants").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt + 2}`;
  }
  return null;
}

export function slugFromName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "my-business"
  );
}
