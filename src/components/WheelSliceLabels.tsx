import {
  clampPrizeLabel,
  describeSlice,
  layoutWheelSliceLabel,
  polarToCartesian,
  sliceLabelRotation,
} from "@/lib/wheel";

export function WheelSliceLabels({
  slices,
  cx,
  cy,
  r,
  clipIdPrefix,
}: {
  slices: { prize: { id: string; label: string }; start: number; end: number }[];
  cx: number;
  cy: number;
  r: number;
  clipIdPrefix: string;
}) {
  const sliceCount = slices.length;

  return (
    <>
      <defs>
        {slices.map((slice) => (
          <clipPath key={slice.prize.id} id={`${clipIdPrefix}-${slice.prize.id}`}>
            <path d={describeSlice(cx, cy, r - 1.5, slice.start, slice.end)} />
          </clipPath>
        ))}
      </defs>
      {slices.map((slice) => {
        const sliceAngle = slice.end - slice.start;
        const mid = (slice.start + slice.end) / 2;
        const layout = layoutWheelSliceLabel(slice.prize.label, sliceAngle, sliceCount, r);
        if (!layout.visible || layout.lines.length === 0) return null;

        const labelPos = polarToCartesian(cx, cy, layout.labelRadius, mid);
        const labelRotation = sliceLabelRotation(mid);
        const totalHeight = (layout.lines.length - 1) * layout.lineHeight;
        const startOffset = -totalHeight / 2;

        return (
          <g key={`label-${slice.prize.id}`} clipPath={`url(#${clipIdPrefix}-${slice.prize.id})`}>
            <text
              x={labelPos.x}
              y={labelPos.y}
              fill="#0a0a0a"
              fontSize={layout.fontSize}
              fontWeight="800"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${labelRotation}, ${labelPos.x}, ${labelPos.y})`}
              style={{ fontFamily: "var(--font-game), system-ui, sans-serif" }}
            >
              {layout.lines.map((line, i) => (
                <tspan key={i} x={labelPos.x} dy={i === 0 ? startOffset : layout.lineHeight}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** Stable id for clip paths (prize ids may contain special chars). */
export function wheelClipPrefix(prizes: { id: string }[]): string {
  return `wheel-clip-${prizes.map((p) => p.id.slice(0, 8)).join("-")}`.replace(/[^a-zA-Z0-9-]/g, "");
}

export { clampPrizeLabel };
