import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMerchant } from "@/lib/merchant";
import { MAX_VIDEO_BYTES } from "@/lib/menu";
import { getTranslations } from "@/i18n/server";
import { getSupabaseServiceRoleKey } from "@/lib/env";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/jpg",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  const t = await getTranslations();
  const merchant = await getCurrentMerchant();
  if (!merchant) {
    return NextResponse.json({ error: t("api.unauthorized") }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== merchant.owner_id) {
    return NextResponse.json({ error: t("api.unauthorized") }, { status: 401 });
  }

  const form = await request.formData();
  const raw = form.get("file");
  if (!raw || typeof raw === "string") {
    return NextResponse.json({ error: t("api.uploadFailed") }, { status: 400 });
  }
  const file = raw as File;

  const kind = String(form.get("kind") ?? "image");
  const isVideo = kind === "video";
  const nameLower = file.name.toLowerCase();
  const inferredVideoType =
    nameLower.endsWith(".mov") || nameLower.endsWith(".qt")
      ? "video/quicktime"
      : nameLower.endsWith(".webm")
        ? "video/webm"
        : nameLower.endsWith(".m4v")
          ? "video/x-m4v"
          : "video/mp4";
  const contentType =
    file.type || (isVideo ? inferredVideoType : "image/jpeg");
  const allowed = isVideo ? VIDEO_TYPES : IMAGE_TYPES;
  if (
    contentType &&
    !allowed.has(contentType) &&
    !contentType.startsWith(isVideo ? "video/" : "image/")
  ) {
    return NextResponse.json({ error: t("api.uploadFailed") }, { status: 400 });
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: t("menuStudio.videoSize") }, { status: 400 });
  }
  if (!isVideo && file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: t("api.uploadFailed") }, { status: 400 });
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    (isVideo ? "mp4" : "jpg");
  const path = `${user.id}/${merchant.id}/menu-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Prefer service role when configured (bypasses bucket RLS). Locally, fall back
  // to the authenticated user client so uploads still work without SUPABASE_SECRET_KEY.
  const storage = getSupabaseServiceRoleKey() ? createAdminClient() : supabase;

  let uploadedBucket = "menu-media";
  let { error } = await storage.storage.from("menu-media").upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    uploadedBucket = "merchant-logos";
    ({ error } = await storage.storage.from("merchant-logos").upload(path, buffer, {
      contentType,
      upsert: false,
    }));
  }

  if (error) {
    console.error("menu upload storage error:", error);
    return NextResponse.json(
      { error: t("api.uploadFailed"), detail: error.message },
      { status: 500 },
    );
  }

  const { data } = storage.storage.from(uploadedBucket).getPublicUrl(path);
  return NextResponse.json({
    url: data.publicUrl,
    path,
    contentType,
    bucket: uploadedBucket,
  });
}
