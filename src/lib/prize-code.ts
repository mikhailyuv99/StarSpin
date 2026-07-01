const PRIZE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePrizeCode(prefix = "WIN"): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += PRIZE_CODE_ALPHABET[Math.floor(Math.random() * PRIZE_CODE_ALPHABET.length)];
  }
  return `${prefix}-${suffix}`;
}
