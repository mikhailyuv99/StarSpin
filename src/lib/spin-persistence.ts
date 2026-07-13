import type { SupabaseClient } from "@supabase/supabase-js";

export type SpinInsertRow = {
  merchant_id: string;
  prize_id: string;
  resolved_prize_id?: string | null;
  device_fingerprint: string;
  phone_number: string | null;
  followed_social: boolean;
  review_screenshot_url: string | null;
  review_screenshot_status: string;
  completed_flow_steps?: string[];
  client_locale?: string | null;
  client_user_agent?: string | null;
  client_ip?: string | null;
};

function isMissingColumnError(message: string, column: string): boolean {
  const lower = message.toLowerCase();
  const col = column.toLowerCase();
  return (
    lower.includes(col) &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find") ||
      lower.includes("column"))
  );
}

function coreSpinRow(row: SpinInsertRow) {
  return {
    merchant_id: row.merchant_id,
    prize_id: row.prize_id,
    device_fingerprint: row.device_fingerprint,
    phone_number: row.phone_number ?? "",
    followed_social: row.followed_social,
    review_screenshot_url: row.review_screenshot_url,
    review_screenshot_status: row.review_screenshot_status,
  };
}

function withAnalytics(row: SpinInsertRow) {
  return {
    client_locale: row.client_locale?.trim() || null,
    client_user_agent: row.client_user_agent?.slice(0, 500) || null,
    client_ip: row.client_ip?.trim() || null,
  };
}

/** Insert a spin row, retrying without optional columns when the DB schema lags migrations. */
export async function insertSpinRow(supabase: SupabaseClient, row: SpinInsertRow) {
  const analytics = withAnalytics(row);
  const payloads: Record<string, unknown>[] = [
    {
      ...coreSpinRow(row),
      ...analytics,
      resolved_prize_id: row.resolved_prize_id ?? null,
      completed_flow_steps: row.completed_flow_steps ?? [],
    },
    {
      ...coreSpinRow(row),
      resolved_prize_id: row.resolved_prize_id ?? null,
      completed_flow_steps: row.completed_flow_steps ?? [],
    },
    {
      ...coreSpinRow(row),
      completed_flow_steps: row.completed_flow_steps ?? [],
    },
    coreSpinRow(row),
  ];

  let lastError: { message: string } | null = null;

  for (const payload of payloads) {
    const result = await supabase.from("spins").insert(payload).select("id").single();
    if (!result.error && result.data?.id) {
      if (payload !== payloads[0]) {
        console.warn("Spin insert used schema fallback; some analytics columns may be missing", {
          keys: Object.keys(payload),
        });
      }
      return result;
    }

    lastError = result.error;
    if (!result.error) continue;

    const message = result.error.message;
    const optionalColumnMissing =
      isMissingColumnError(message, "resolved_prize_id") ||
      isMissingColumnError(message, "completed_flow_steps") ||
      isMissingColumnError(message, "client_locale") ||
      isMissingColumnError(message, "client_user_agent") ||
      isMissingColumnError(message, "client_ip");

    if (!optionalColumnMissing) {
      return result;
    }
  }

  return {
    data: null,
    error: lastError ?? { message: "Spin insert failed" },
  };
}

export async function updateSpinPrizeResolution(
  supabase: SupabaseClient,
  spinId: string,
  prizeId: string,
  resolvedPrizeId: string | null,
) {
  let result = await supabase
    .from("spins")
    .update({ prize_id: prizeId, resolved_prize_id: resolvedPrizeId })
    .eq("id", spinId)
    .is("prize_code", null);

  if (result.error && isMissingColumnError(result.error.message, "resolved_prize_id")) {
    result = await supabase
      .from("spins")
      .update({ prize_id: prizeId })
      .eq("id", spinId)
      .is("prize_code", null);
  }

  return result;
}

/** Attach / refresh review screenshot on an existing unclaimed spin. */
export async function attachSpinScreenshot(
  supabase: SupabaseClient,
  spinId: string,
  merchantId: string,
  screenshotUrl: string,
  status: string = "pending",
) {
  return supabase
    .from("spins")
    .update({
      review_screenshot_url: screenshotUrl,
      review_screenshot_status: status,
    })
    .eq("id", spinId)
    .eq("merchant_id", merchantId)
    .is("prize_code", null)
    .select("id")
    .maybeSingle();
}
