import Link from "next/link";
import {
  STARSPIN_MARK_PATHS,
  STARSPIN_MARK_TRANSFORM,
  STARSPIN_MARK_VIEWBOX,
} from "@/lib/starspin-mark";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

const markSizes: Record<LogoSize, number> = {
  sm: 22,
  md: 28,
  lg: 34,
};

export function StarspinMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`starspin-mark ${className}`.trim()}
      width={size}
      height={size}
      viewBox={`0 0 ${STARSPIN_MARK_VIEWBOX} ${STARSPIN_MARK_VIEWBOX}`}
      fill="none"
      aria-hidden
    >
      <g transform={STARSPIN_MARK_TRANSFORM}>
        {STARSPIN_MARK_PATHS.map((d) => (
          <path key={d.slice(0, 24)} d={d} fill="currentColor" />
        ))}
      </g>
    </svg>
  );
}

export function StarspinLogo({
  href = "/",
  variant = "light",
  size = "md",
  showWordmark = true,
  wordmark = "STARSPIN",
  className = "",
}: {
  href?: string;
  variant?: LogoVariant;
  size?: LogoSize;
  showWordmark?: boolean;
  wordmark?: string;
  className?: string;
}) {
  const markSize = markSizes[size];
  const innerClass = [
    "starspin-logo",
    `starspin-logo--${variant}`,
    `starspin-logo--${size}`,
  ].join(" ");

  const content = (
    <span className={innerClass}>
      <StarspinMark size={markSize} className="starspin-logo__mark" />
      {showWordmark && <span className="starspin-logo__word">{wordmark}</span>}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={["starspin-logo-link", className].filter(Boolean).join(" ")}
        aria-label={wordmark}
      >
        {content}
      </Link>
    );
  }

  return content;
}
