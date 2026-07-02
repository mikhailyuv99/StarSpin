const DEFAULT_REGION = (process.env.DEFAULT_PHONE_REGION ?? "FR").toUpperCase();

/** Normalize to E.164. Defaults to France (+33) for local numbers starting with 0. */
export function normalizePhone(phone: string, region = DEFAULT_REGION): string {
  const cleaned = phone.replace(/[\s.-]/g, "");
  if (!cleaned) return cleaned;
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;

  if (region === "FR" && cleaned.startsWith("0")) {
    return `+33${cleaned.slice(1)}`;
  }
  if (region === "VN" && cleaned.startsWith("0")) {
    return `+84${cleaned.slice(1)}`;
  }

  return `+${cleaned}`;
}
