import { useId } from "react";

/** Downward casino-style pointer — tip at bottom points into the wheel at 12 o'clock. */
export function WheelPointer({
  width = 28,
  height = 22,
  className = "",
  color = "#0a0a0a",
  innerColor = "#f5e08e",
}: {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  innerColor?: string;
}) {
  const shadowId = useId().replace(/:/g, "");

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 32"
      className={className}
      aria-hidden
    >
      <defs>
        <filter id={`wp-shadow-${shadowId}`} x="-25%" y="-15%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.25" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter={`url(#wp-shadow-${shadowId})`}>
        {/* Outer pin — rounded shield pointing down */}
        <path
          d="M18 30.5 C18 30.5 3.5 14.5 3.5 10 C3.5 5.2 9.8 1.5 18 1.5 C26.2 1.5 32.5 5.2 32.5 10 C32.5 14.5 18 30.5 18 30.5 Z"
          fill={color}
        />
        {/* Inner fill */}
        <path
          d="M18 26.5 C18 26.5 8 13.8 8 10.2 C8 7.2 12.2 4.8 18 4.8 C23.8 4.8 28 7.2 28 10.2 C28 13.8 18 26.5 18 26.5 Z"
          fill={innerColor}
        />
        {/* Highlight notch at the top */}
        <ellipse cx="18" cy="9.5" rx="4.5" ry="3" fill={color} opacity="0.22" />
      </g>
    </svg>
  );
}
