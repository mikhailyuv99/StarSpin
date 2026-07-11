import { NextResponse } from "next/server";
import QRCode from "qrcode";
import {
  publicMerchantMenuUrl,
  publicMerchantPlayUrl,
  publicMerchantUrl,
} from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeHex(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return fallback;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");
  const url =
    target === "menu"
      ? publicMerchantMenuUrl(slug)
      : target === "play"
        ? publicMerchantPlayUrl(slug)
        : publicMerchantUrl(slug);

  let fg = normalizeHex(searchParams.get("fg"), "#0a0a0a");
  let bg = normalizeHex(searchParams.get("bg"), "#ffffff");

  try {
    const supabase = createAdminClient();
    const { data: merchant } = await supabase
      .from("merchants")
      .select("qr_fg_color, qr_bg_color")
      .eq("slug", slug)
      .maybeSingle();

    if (merchant) {
      if (!searchParams.has("fg")) fg = normalizeHex(merchant.qr_fg_color, fg);
      if (!searchParams.has("bg")) bg = normalizeHex(merchant.qr_bg_color, bg);
    }
  } catch {
    /* preview without DB — use query params or defaults */
  }

  const png = await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    color: { dark: fg, light: bg },
  });

  const filename =
    target === "menu" ? `qr-${slug}-menu.png` : target === "play" ? `qr-${slug}-play.png` : `qr-${slug}.png`;

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
