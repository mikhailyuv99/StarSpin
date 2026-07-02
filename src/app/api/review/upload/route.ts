import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiT, resolveRequestLocale } from "@/i18n/api";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  const limited = rateLimit(clientIpKey(request, "review-upload"), 15, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: t("api.rateLimited") },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const merchantId = formData.get("merchantId") as string | null;

    if (!file || !merchantId) {
      return NextResponse.json({ error: t("api.fileMerchantRequired") }, { status: 400 });
    }

    const supabase = createAdminClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${merchantId}/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from("review-screenshots")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("review-screenshots")
      .getPublicUrl(path);

    return NextResponse.json({ path, url: urlData.publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: t("api.uploadFailed") }, { status: 500 });
  }
}
