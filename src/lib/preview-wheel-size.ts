/** iPhone 14-class logical viewport — must match real customer journey canvas. */
export const PHONE_PREVIEW_DESIGN_WIDTH = 390;
/** Matches 100svh on iPhone 14 Safari (visible area with browser chrome) — same as .public-flow. */
export const PHONE_PREVIEW_DESIGN_HEIGHT = 742;

/** Same diameter as a real customer phone at 390px width. */
export function computePreviewWheelSize(): number {
  return Math.min(Math.max(PHONE_PREVIEW_DESIGN_WIDTH - 72, 260), 320);
}
