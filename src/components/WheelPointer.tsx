/** Downward pointer — tip at bottom points into the wheel at 12 o'clock. */
export function WheelPointer({
  width = 28,
  height = 22,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 28 22"
      className={className}
      aria-hidden
    >
      <polygon points="14,22 0,0 28,0" fill="#0a0a0a" />
      <polygon points="14,19 3,3 25,3" fill="#f5e08e" />
    </svg>
  );
}
