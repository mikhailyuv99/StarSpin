import {
  DEFAULT_PRIZE_ICON,
  normalizePrizeIcon,
  PRIZE_ICONS,
  type PrizeIconId,
} from "@/lib/prize-icons";
import { PrizeMarkText } from "@/components/PrizeMarkText";
import { rasterIconTransform } from "@/lib/prize-icon-render";

type PrizeWheelIconProps = {
  icon?: string | null;
  size?: number;
  className?: string;
  title?: string;
  /** Hide soft plate (useful inside already colored chips). */
  plain?: boolean;
};

/** Colorful prize icon for wheel / picker / claim. */
export function PrizeWheelIcon({
  icon,
  size = 28,
  className,
  title,
  plain = false,
}: PrizeWheelIconProps) {
  const id = normalizePrizeIcon(icon) as PrizeIconId;
  const def = PRIZE_ICONS[id] ?? PRIZE_ICONS[DEFAULT_PRIZE_ICON];

  if (def.src) {
    const pad = plain ? 0 : Math.max(2, Math.round(size * 0.08));
    const inner = Math.max(8, size - pad * 2);
    return (
      <span
        className={className}
        title={title}
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: plain ? "transparent" : def.plate,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={def.src}
          alt=""
          width={inner}
          height={inner}
          draggable={false}
          style={{
            width: inner,
            height: inner,
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
            transform: rasterIconTransform(def.assetNudge, inner),
          }}
        />
      </span>
    );
  }

  const shapes = def.shapes ?? [];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {!plain && <circle cx="12" cy="12" r="11" fill={def.plate} />}
      <g transform={def.fit || undefined}>
        {shapes.map((shape, i) => (
          <path
            key={i}
            d={shape.d}
            fill={shape.fill === "none" ? "none" : shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {def.markText ? <PrizeMarkText text={def.markText} size={def.markTextSize} /> : null}
      </g>
    </svg>
  );
}
