/** 0 = désactivé (tests). Remettre 30 en prod via SPIN_COOLDOWN_DAYS sur Netlify. */
export const SPIN_COOLDOWN_DAYS = Number(process.env.SPIN_COOLDOWN_DAYS ?? "0");

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_LENGTH = 6;
