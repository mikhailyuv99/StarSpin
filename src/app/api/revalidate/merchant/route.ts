import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePublicMerchant } from "@/lib/revalidate-public-merchant";

/** Bust the public journey cache after dashboard edits. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    slug?: string;
    previousSlug?: string;
  } | null;
  const slug = body?.slug?.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!merchant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidatePublicMerchant(slug);
  const previousSlug = body?.previousSlug?.trim().toLowerCase();
  if (previousSlug && previousSlug !== slug) {
    revalidatePublicMerchant(previousSlug);
  }

  return NextResponse.json({ ok: true });
}
