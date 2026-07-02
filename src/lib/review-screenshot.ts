/** Storage path in review-screenshots bucket, or legacy public URL. */
export function reviewScreenshotHref(stored: string): string {
  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    return stored;
  }
  return `/api/review/screenshot?path=${encodeURIComponent(stored)}`;
}
