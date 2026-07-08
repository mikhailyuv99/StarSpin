import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiT, resolveRequestLocale } from "@/i18n/api";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  const limited = rateLimit(clientIpKey(request, "review-upload"), 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: t("api.rateLimited") },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const merchantIdRaw = formData.get("merchantId");
    const merchantId = typeof merchantIdRaw === "string" ? merchantIdRaw : null;

    if (!(file instanceof Blob) || !merchantId) {
      return NextResponse.json({ error: t("api.fileMerchantRequired") }, { status: 400 });
    }

    const maxBytes = 12 * 1024 * 1024;
    if (file.size <= 0 || file.size > maxBytes) {
      return NextResponse.json({ error: t("api.uploadFailed") }, { status: 400 });
    }

    const fileName = file instanceof File ? file.name : "screenshot.jpg";
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "image/heif": "heif",
    };
    const nameExt = fileName.split(".").pop()?.toLowerCase();
    const ext =
      mimeToExt[file.type] ??
      (nameExt && /^[a-z0-9]+$/.test(nameExt) ? nameExt : "jpg");
    const contentType = file.type || (ext === "jpg" ? "image/jpeg" : `image/${ext}`);

    const supabase = createAdminClient();
    const path = `${merchantId}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("review-screenshots")
      .upload(path, buffer, { contentType, upsert: false });

    if (error) {
      // Duplicate object races are still a usable upload for the customer.
      const softDuplicate =
        /exists|duplicate|already/i.test(error.message) || error.message.includes("409");
      if (!softDuplicate) {
        console.error("Upload storage error:", error);
        return NextResponse.json({ error: t("api.uploadFailed") }, { status: 500 });
      }
    }

    const { data: urlData } = supabase.storage.from("review-screenshots").getPublicUrl(path);

    return NextResponse.json(
      { path, url: urlData.publicUrl },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: t("api.uploadFailed") }, { status: 500 });
  }
}
