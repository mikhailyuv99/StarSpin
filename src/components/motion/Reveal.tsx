"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Progressive-enhancement reveal.
 *
 * Content is fully visible on first paint (and without JS). Once mounted, any
 * element that is still below the fold is hidden and then faded up as it scrolls
 * into view. This keeps the initial render instant instead of shipping an
 * opacity:0 page that only appears after hydration.
 */
function useReveal(delay: number, y: number) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;

    if (prefersReduced || inView) {
      el.classList.add("reveal-in");
      return;
    }

    el.classList.add("reveal-pre");
    el.style.setProperty("--reveal-y", `${y}px`);
    if (delay) el.style.setProperty("--reveal-delay", `${delay}s`);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("reveal-in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay, y]);

  return ref;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
  style?: CSSProperties;
};

export function Reveal({ children, className, delay = 0, y = 28, style }: RevealProps) {
  const ref = useReveal(delay, y);
  return (
    <div ref={ref} className={`reveal ${className ?? ""}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function RevealStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useReveal(0, 22);
  return (
    <div ref={ref} className={`reveal ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}
