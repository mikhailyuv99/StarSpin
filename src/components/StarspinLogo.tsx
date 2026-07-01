import Link from "next/link";

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
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
    >
      <g className="starspin-mark__orbit">
        <circle
          cx="20"
          cy="20"
          r="15"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="7 5"
          strokeLinecap="round"
          opacity="0.4"
        />
        <circle cx="35" cy="20" r="2.25" fill="var(--starspin-accent, #f5e08e)" stroke="currentColor" strokeWidth="1.75" />
      </g>
      <g className="starspin-mark__star">
        <path
          d="M20 7.5 22.4 14.8 30 14.8 23.8 19.2 26.2 26.5 20 22.2 13.8 26.5 16.2 19.2 10 14.8 17.6 14.8Z"
          fill="var(--starspin-accent, #f5e08e)"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
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
