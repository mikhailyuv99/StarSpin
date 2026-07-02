import { sendEmail } from "@/lib/email";

export async function sendMerchantBillingEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  return sendEmail({
    to,
    subject,
    html: `<p>${body}</p><p><a href="https://starspin.cc/dashboard/billing">Open billing</a></p>`,
    text: `${body}\n\nhttps://starspin.cc/dashboard/billing`,
  });
}
