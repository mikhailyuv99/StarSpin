/** Normalize to E.164. Regional rules apply only when DEFAULT_PHONE_REGION is set. */
export function normalizePhone(phone: string, region?: string): string {
  const cleaned = phone.replace(/[\s.-]/g, "");
  if (!cleaned) return cleaned;
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;

  const effectiveRegion = (region ?? process.env.DEFAULT_PHONE_REGION)?.toUpperCase();
  if (effectiveRegion === "FR" && cleaned.startsWith("0")) {
    return `+33${cleaned.slice(1)}`;
  }
  if (effectiveRegion === "VN" && cleaned.startsWith("0")) {
    return `+84${cleaned.slice(1)}`;
  }

  return `+${cleaned}`;
}
