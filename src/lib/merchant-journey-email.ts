import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";
import { OFFICIAL_SITE_HOST } from "@/lib/brand";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiT } from "@/i18n/api";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getStripe, marketFromPriceId } from "@/lib/stripe";

export type MerchantJourneyNotificationParams = {
  merchantEmail: string;
  merchantName: string;
  customerFirstName: string;
  customerEmail: string;
  customerPhone?: string | null;
  prizeLabel: string;
  prizeCode: string;
  reviewScreenshotSignedUrl?: string | null;
  /** Merchant notification language (fr for France-market merchants). */
  locale?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveEmailLocale(locale?: string): Locale {
  return locale && isLocale(locale) ? locale : defaultLocale;
}

function merchantJourneyEmailHtml(
  params: MerchantJourneyNotificationParams,
  locale: Locale,
): string {
  const t = apiT(locale);
  const crmUrl = `${getAppUrl()}/dashboard/crm`;
  const reviewsUrl = `${getAppUrl()}/dashboard/reviews`;
  const phoneRow = params.customerPhone?.trim()
    ? `<tr><td style="padding:8px 0;color:#666;font-size:12px;font-weight:700;text-transform:uppercase;">${escapeHtml(t("email.journeyPhone"))}</td></tr>
       <tr><td style="padding:0 0 12px;font-size:15px;color:#0a0a0a;">${escapeHtml(params.customerPhone.trim())}</td></tr>`
    : "";

  const intro = t("email.journeyIntro", { merchant: `{merchant}` }).replace(
    "{merchant}",
    `<strong>${escapeHtml(params.merchantName)}</strong>`,
  );

  const screenshotBlock = params.reviewScreenshotSignedUrl
    ? `<div style="margin:20px 0;padding:16px;background:#faf6ee;border:2px solid #0a0a0a;border-radius:12px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#666;">${escapeHtml(t("email.journeyScreenshot"))}</p>
        <a href="${escapeHtml(params.reviewScreenshotSignedUrl)}" style="display:block;">
          <img src="${escapeHtml(params.reviewScreenshotSignedUrl)}" alt="${escapeHtml(t("email.journeyScreenshot"))}" width="400" style="display:block;max-width:100%;height:auto;border:2px solid #0a0a0a;border-radius:8px;" />
        </a>
        <p style="margin:12px 0 0;font-size:12px;color:#555;">${escapeHtml(t("email.journeyVerify"))}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ececec;font-family:'Segoe UI',system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ececec;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:3px solid #0a0a0a;border-radius:16px;box-shadow:6px 6px 0 #0a0a0a;overflow:hidden;">
        <tr><td style="background:#d8ccf5;padding:20px 24px;border-bottom:3px solid #0a0a0a;">
          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0a0a0a;">STARSPIN</p>
          <h1 style="margin:8px 0 0;font-size:20px;font-weight:900;text-transform:uppercase;color:#0a0a0a;line-height:1.25;">${escapeHtml(t("email.journeyTitle"))}</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#333;">
            ${intro}
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
            <tr><td style="padding:8px 0;color:#666;font-size:12px;font-weight:700;text-transform:uppercase;">${escapeHtml(t("email.journeyCustomer"))}</td></tr>
            <tr><td style="padding:0 0 4px;font-size:15px;font-weight:700;color:#0a0a0a;">${escapeHtml(params.customerFirstName)}</td></tr>
            <tr><td style="padding:0 0 12px;font-size:14px;color:#333;"><a href="mailto:${escapeHtml(params.customerEmail)}" style="color:#0a0a0a;">${escapeHtml(params.customerEmail)}</a></td></tr>
            ${phoneRow}
            <tr><td style="padding:8px 0;color:#666;font-size:12px;font-weight:700;text-transform:uppercase;">${escapeHtml(t("email.journeyPrize"))}</td></tr>
            <tr><td style="padding:0 0 12px;font-size:15px;color:#0a0a0a;">${escapeHtml(params.prizeLabel)}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:12px;font-weight:700;text-transform:uppercase;">${escapeHtml(t("email.journeyCode"))}</td></tr>
            <tr><td style="padding:0;font-family:ui-monospace,monospace;font-size:22px;font-weight:900;letter-spacing:0.06em;color:#0a0a0a;">${escapeHtml(params.prizeCode)}</td></tr>
          </table>
          ${screenshotBlock}
          <div style="margin-top:24px;text-align:center;">
            <a href="${crmUrl}" style="display:inline-block;padding:12px 20px;background:#f5e08e;color:#0a0a0a;font-size:14px;font-weight:800;text-decoration:none;border:2px solid #0a0a0a;border-radius:10px;box-shadow:3px 3px 0 #0a0a0a;">${escapeHtml(t("email.journeyOpenCrm"))}</a>
            ${params.reviewScreenshotSignedUrl ? `<a href="${reviewsUrl}" style="display:inline-block;margin-left:10px;padding:12px 20px;background:#fff;color:#0a0a0a;font-size:14px;font-weight:800;text-decoration:none;border:2px solid #0a0a0a;border-radius:10px;">${escapeHtml(t("email.journeyReviews"))}</a>` : ""}
          </div>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;border-top:2px solid #ececec;">
          <p style="margin:0;font-size:11px;color:#888;text-align:center;">${escapeHtml(t("email.poweredBy", { host: OFFICIAL_SITE_HOST }))}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendMerchantJourneyCompleteEmail(
  params: MerchantJourneyNotificationParams,
): Promise<boolean> {
  const locale = resolveEmailLocale(params.locale);
  const t = apiT(locale);
  const subject = t("email.journeySubject", {
    code: params.prizeCode,
    merchant: params.merchantName,
  });
  const html = merchantJourneyEmailHtml(params, locale);
  const text = [
    t("email.journeyTextIntro", { merchant: params.merchantName }),
    ``,
    `${t("email.journeyCustomer")}: ${params.customerFirstName}`,
    `Email: ${params.customerEmail}`,
    params.customerPhone?.trim()
      ? `${t("email.journeyPhone")}: ${params.customerPhone.trim()}`
      : null,
    `${t("email.journeyPrize")}: ${params.prizeLabel}`,
    `${t("email.journeyCode")}: ${params.prizeCode}`,
    params.reviewScreenshotSignedUrl
      ? `${t("email.journeyScreenshot")}: ${params.reviewScreenshotSignedUrl}`
      : null,
    ``,
    `CRM: ${getAppUrl()}/dashboard/crm`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail({ to: params.merchantEmail, subject, html, text });
}

/**
 * France-market merchants get French notification emails.
 * Signals: EUR redemption currency, Stripe FR price, or subscription metadata.
 */
export async function resolveMerchantNotifyLocale(opts: {
  supabase: ReturnType<typeof createAdminClient>;
  merchantId: string;
  accountId?: string | null;
  stripeSubscriptionId?: string | null;
  redeemCurrency?: string | null;
}): Promise<Locale> {
  if (opts.redeemCurrency?.toUpperCase() === "EUR") {
    return "fr";
  }

  let subscriptionId = opts.stripeSubscriptionId?.trim() || null;

  if (!subscriptionId) {
    const accountId = opts.accountId;
    if (accountId) {
      const { data: account } = await opts.supabase
        .from("merchant_accounts")
        .select("stripe_subscription_id")
        .eq("id", accountId)
        .maybeSingle();
      subscriptionId = account?.stripe_subscription_id ?? null;
    } else {
      const { data: merchant } = await opts.supabase
        .from("merchants")
        .select("account_id, stripe_subscription_id")
        .eq("id", opts.merchantId)
        .maybeSingle();
      subscriptionId = merchant?.stripe_subscription_id ?? null;
      if (!subscriptionId && merchant?.account_id) {
        const { data: account } = await opts.supabase
          .from("merchant_accounts")
          .select("stripe_subscription_id")
          .eq("id", merchant.account_id)
          .maybeSingle();
        subscriptionId = account?.stripe_subscription_id ?? null;
      }
    }
  }

  if (subscriptionId) {
    try {
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (sub.metadata?.pricing_market === "fr") return "fr";
      const priceId = sub.items.data[0]?.price?.id;
      if (priceId && marketFromPriceId(priceId) === "fr") return "fr";
    } catch (err) {
      console.warn("[email] Could not resolve merchant Stripe market:", err);
    }
  }

  return defaultLocale;
}

export async function getMerchantOwnerEmail(
  supabase: ReturnType<typeof createAdminClient>,
  ownerId: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(ownerId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

export async function signedReviewScreenshotForEmail(
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath?.trim()) return null;
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("review-screenshots")
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

  if (error || !data?.signedUrl) {
    console.error("signedReviewScreenshotForEmail:", error);
    return null;
  }

  return data.signedUrl;
}
