import { describeSlice, polarToCartesian } from "@/lib/wheel";

const SLICES = [
  { color: "#f5e08e", label: "10%" },
  { color: "#d8ccf5", label: "Drink" },
  { color: "#f48fb1", label: "Sweet" },
  { color: "#a8e6cf", label: "Free" },
  { color: "#b8cfe8", label: "2×" },
  { color: "#f4a89a", label: "Win!" },
] as const;

export function MarketingSpinWheel({
  size = 120,
  animate = false,
  className = "",
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const cx = 50;
  const cy = 50;
  const r = 44;
  const sliceAngle = 360 / SLICES.length;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`marketing-wheel ${animate ? "marketing-wheel--spin" : ""} ${className}`.trim()}
      aria-hidden
    >
      <circle cx={cx} cy={cy} r={r + 3} fill="#fff" stroke="#0a0a0a" strokeWidth="2.5" />
      <g className={animate ? "marketing-wheel__disc" : undefined}>
        {SLICES.map((slice, i) => {
          const start = i * sliceAngle;
          const end = (i + 1) * sliceAngle;
          const mid = start + sliceAngle / 2;
          const labelPos = polarToCartesian(cx, cy, 26, mid);
          return (
            <g key={slice.label}>
              <path
                d={describeSlice(cx, cy, r, start, end)}
                fill={slice.color}
                stroke="#0a0a0a"
                strokeWidth="1.25"
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill="#0a0a0a"
                fontSize="5.5"
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid + 90}, ${labelPos.x}, ${labelPos.y})`}
              >
                {slice.label}
              </text>
            </g>
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r="9" fill="#fff" stroke="#0a0a0a" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="3.5" fill="#f5e08e" stroke="#0a0a0a" strokeWidth="1.25" />
      <polygon points="50,3 46.5,11 53.5,11" fill="#0a0a0a" />
    </svg>
  );
}

export function MarketingQrIcon({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <rect x="2" y="2" width="8" height="8" rx="1" fill="#0a0a0a" />
      <rect x="14" y="2" width="8" height="8" rx="1" fill="#0a0a0a" />
      <rect x="2" y="14" width="8" height="8" rx="1" fill="#0a0a0a" />
      <rect x="14" y="14" width="3" height="3" fill="#0a0a0a" />
      <rect x="19" y="14" width="3" height="3" fill="#0a0a0a" />
      <rect x="14" y="19" width="3" height="3" fill="#0a0a0a" />
      <rect x="19" y="19" width="3" height="3" fill="#0a0a0a" />
    </svg>
  );
}
