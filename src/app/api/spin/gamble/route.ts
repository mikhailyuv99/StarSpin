import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";
import { isDoubleOrNothingMechanic } from "@/lib/prize-mechanics";
import type { Prize } from "@/lib/types";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  const limited = rateLimit(clientIpKey(request, "spin-gamble"), 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: t("api.rateLimited") },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const body = await request.json();
    const spinId = typeof body.spinId === "string" ? body.spinId.trim() : "";
    const choice = body.choice === "risk" ? "risk" : body.choice === "keep" ? "keep" : null;

    if (!spinId || !choice) {
      return NextResponse.json({ error: t("api.missingFields") }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: spin, error: spinError } = await supabase
      .from("spins")
      .select("id, prize_id, prize_code, resolved_prize_id, prize:prizes(*)")
      .eq("id", spinId)
      .maybeSingle();

    if (spinError || !spin) {
      return NextResponse.json({ error: t("api.spinNotFound") }, { status: 404 });
    }

    if (spin.prize_code) {
      return NextResponse.json({ error: t("api.spinAlreadyClaimed") }, { status: 409 });
    }

    const displayPrize = (Array.isArray(spin.prize) ? spin.prize[0] : spin.prize) as Prize | null;
    if (!displayPrize || !isDoubleOrNothingMechanic(displayPrize)) {
      return NextResponse.json({ error: t("api.spinGambleNotAllowed") }, { status: 400 });
    }

    if (!spin.resolved_prize_id) {
      return NextResponse.json({ error: t("api.spinGambleNotAllowed") }, { status: 400 });
    }

    if (choice === "keep") {
      const { data: resolved } = await supabase
        .from("prizes")
        .select("*")
        .eq("id", spin.resolved_prize_id)
        .maybeSingle();

      return NextResponse.json({
        outcome: "kept",
        prize: resolved as Prize,
      });
    }

    const won = Math.random() < 0.5;
    if (won) {
      const { data: resolved } = await supabase
        .from("prizes")
        .select("*")
        .eq("id", spin.resolved_prize_id)
        .maybeSingle();

      return NextResponse.json({
        outcome: "doubled",
        prize: resolved as Prize,
      });
    }

    await supabase.from("spins").update({ resolved_prize_id: null }).eq("id", spinId);

    return NextResponse.json({
      outcome: "lost",
      prize: null,
    });
  } catch (err) {
    console.error("Spin gamble error:", err);
    return NextResponse.json({ error: t("api.spinError") }, { status: 500 });
  }
}
