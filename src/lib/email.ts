import { OFFICIAL_SITE_HOST } from "./brand";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { apiT } from "@/i18n/api";

type PrizeEmailParams = {
  to: string;
  firstName: string;
  prizeLabel: string;
  prizeCode: string;
  merchantName: string;
  locale?: string;
  ruleLines?: string[];
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

function prizeEmailHtml({
  firstName,
  prizeLabel,
  prizeCode,
  merchantName,
  ruleLines = [],
  locale,
}: Omit<PrizeEmailParams, "to"> & { locale: Locale }): string {
  const t = apiT(locale);
  const congrats = t("email.prizeCongrats", {
    prize: `{prize}`,
    merchant: `{merchant}`,
  })
    .replace("{prize}", `<strong>${escapeHtml(prizeLabel)}</strong>`)
    .replace("{merchant}", `<strong>${escapeHtml(merchantName)}</strong>`);

  const rulesHtml =
    ruleLines.length > 0
      ? `<div style="margin:0 0 20px;padding:16px;background:#faf6ee;border:2px solid #0a0a0a;border-radius:12px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#666;">${escapeHtml(t("email.prizeRulesTitle"))}</p>
          <ul style="margin:0;padding:0 0 0 18px;color:#333;font-size:14px;line-height:1.5;">
            ${ruleLines.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ececec;font-family:'Segoe UI',system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ececec;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border:3px solid #0a0a0a;border-radius:16px;box-shadow:6px 6px 0 #0a0a0a;overflow:hidden;">
        <tr><td style="background:#f5e08e;padding:20px 24px;border-bottom:3px solid #0a0a0a;">
          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0a0a0a;">STARSPIN</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;text-transform:uppercase;color:#0a0a0a;line-height:1.2;">${escapeHtml(t("email.prizeTitle"))}</h1>
        </td></tr>
        <tr><td style="padding:28px 24px;">
          <p style="margin:0 0 8px;font-size:15px;color:#333;">${escapeHtml(t("email.prizeHi", { name: firstName }))}</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#333;">
            ${congrats}
          </p>
          <div style="background:#faf6ee;border:2px dashed #0a0a0a;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#666;">${escapeHtml(t("email.prizeCodeLabel"))}</p>
            <p style="margin:0;font-family:ui-monospace,monospace;font-size:32px;font-weight:900;letter-spacing:0.08em;color:#0a0a0a;">${escapeHtml(prizeCode)}</p>
          </div>
          ${rulesHtml}
          <p style="margin:0;font-size:14px;line-height:1.5;color:#555;">${escapeHtml(t("email.prizeShowCode"))}</p>
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

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "STARSPIN <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set - email skipped (dev mode)");
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(text ? { text } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] Resend error:", err);
    return false;
  }

  return true;
}

export async function sendPrizeEmail(params: PrizeEmailParams): Promise<boolean> {
  const locale = resolveEmailLocale(params.locale);
  const t = apiT(locale);
  const subject = t("email.prizeSubject", { code: params.prizeCode });
  const html = prizeEmailHtml({ ...params, locale });

  return sendEmail({ to: params.to, subject, html });
}
