export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

export async function sendSmsMessage(phone: string, body: string): Promise<boolean> {
  if (!isSmsConfigured()) {
    console.log(`[SMS dev] ${phone}: ${body}`);
    return false;
  }

  const twilio = await import("twilio");
  const client = twilio.default(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );
  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
  return true;
}
