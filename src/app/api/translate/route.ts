import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMerchant } from "@/lib/merchant";
import { isLocale, type Locale } from "@/i18n/config";
import { translateTexts } from "@/lib/translate-text";
import { getTranslations } from "@/i18n/server";

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

  const body = (await request.json().catch(() => null)) as {
    texts?: unknown;
    from?: unknown;
    to?: unknown;
  } | null;

  const texts = Array.isArray(body?.texts)
    ? body.texts.filter((x): x is string => typeof x === "string").slice(0, 80)
    : [];
  const from = typeof body?.from === "string" && isLocale(body.from) ? (body.from as Locale) : null;
  const to = typeof body?.to === "string" && isLocale(body.to) ? (body.to as Locale) : null;

  if (!from || !to || !texts.length) {
    return NextResponse.json({ error: t("api.missingFields") }, { status: 400 });
  }

  const translations = await translateTexts(texts, from, to);
  return NextResponse.json({ translations });
}
