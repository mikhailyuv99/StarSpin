/** @deprecated Use per-merchant spin_cooldown_days in dashboard instead. */
export const SPIN_COOLDOWN_DAYS = Number(process.env.SPIN_COOLDOWN_DAYS ?? "0");

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_LENGTH = 6;
