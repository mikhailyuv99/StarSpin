import {
  layoutWheelSliceIcon,
  polarToCartesian,
  sliceLabelRotation,
} from "@/lib/wheel";
import { normalizePrizeIcon, PRIZE_ICONS } from "@/lib/prize-icons";
import { PrizeMarkText } from "@/components/PrizeMarkText";
import { rasterIconOriginOffset, rasterIconTransform } from "@/lib/prize-icon-render";

export function WheelSliceLabels({
  slices,
  cx,
  cy,
  r,
}: {
  slices: { prize: { id: string; label: string; icon?: string | null }; start: number; end: number }[];
  cx: number;
  cy: number;
  r: number;
  /** @deprecated Icons are no longer wedge-clipped; kept for call-site compatibility. */
  clipIdPrefix?: string;
  color?: string;
}) {
  const sliceCount = Math.max(slices.length, 1);

  return (
    <>
      {slices.map((slice) => {
        const sliceAngle = slice.end - slice.start;
        const { iconSize, labelRadius } = layoutWheelSliceIcon(sliceAngle, sliceCount, r);
        const mid = (slice.start + slice.end) / 2;
        const pos = polarToCartesian(cx, cy, labelRadius, mid);
        const rotation = sliceLabelRotation(mid);
        const iconId = normalizePrizeIcon(slice.prize.icon);
        const def = PRIZE_ICONS[iconId];
        const half = iconSize / 2;

        const nudge = def.assetNudge;
        const scale = nudge?.scale ?? 1;
        const imgSize = iconSize * scale;
        const imgOffset = rasterIconOriginOffset(iconSize, scale);

        return (
          <g
            key={`icon-${slice.prize.id}`}
            className="wheel-slice-icon"
            transform={`translate(${pos.x}, ${pos.y}) rotate(${rotation})`}
            opacity={1}
          >
            {def.src ? (
              <g transform={rasterIconTransform(nudge, iconSize)} opacity={1}>
                <image
                  href={def.src}
                  x={imgOffset}
                  y={imgOffset}
                  width={imgSize}
                  height={imgSize}
                  opacity={1}
                  preserveAspectRatio="xMidYMid meet"
                />
              </g>
            ) : (
              <svg
                x={-half}
                y={-half}
                width={iconSize}
                height={iconSize}
                viewBox="0 0 24 24"
                overflow="visible"
                opacity={1}
              >
                <g transform={def.fit || undefined} opacity={1}>
                  {(def.shapes ?? []).map((shape, i) => (
                    <path
                      key={i}
                      d={shape.d}
                      fill={shape.fill === "none" ? "none" : shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={1}
                    />
                  ))}
                  {def.markText ? <PrizeMarkText text={def.markText} size={def.markTextSize} /> : null}
                </g>
              </svg>
            )}
          </g>
        );
      })}
    </>
  );
}

/** @deprecated Clip paths removed — icons render at full opacity without wedge masks. */
export function wheelClipPrefix(prizes: { id: string }[]): string {
  return `wheel-clip-${prizes.map((p) => p.id.slice(0, 8)).join("-")}`.replace(/[^a-zA-Z0-9-]/g, "");
}

export { clampPrizeLabel } from "@/lib/wheel";
