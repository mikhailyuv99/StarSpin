export const MIN_PASSWORD_LENGTH = 6;

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}

/** Only allow same-origin relative redirects after auth callbacks. */
export function safeAuthRedirectPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
