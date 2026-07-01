"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import type { FallerItem } from "./faller-pools";

type FallerInstance = {
  glyph: string;
  kind: "emoji" | "text";
  left: number;
  startTop: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  drift: number;
};

/** Spread fallers across the section — not clustered in one band */
const FALLER_SLOTS = [
  { left: 5, startTop: -18 },
  { left: 18, startTop: 8 },
  { left: 32, startTop: -10 },
  { left: 46, startTop: 22 },
  { left: 58, startTop: -6 },
  { left: 71, startTop: 14 },
  { left: 84, startTop: -14 },
  { left: 93, startTop: 4 },
  { left: 12, startTop: 32 },
  { left: 27, startTop: -22 },
  { left: 41, startTop: 18 },
  { left: 55, startTop: -16 },
  { left: 67, startTop: 28 },
  { left: 79, startTop: -8 },
  { left: 8, startTop: 42 },
  { left: 38, startTop: -4 },
  { left: 62, startTop: 36 },
  { left: 88, startTop: 20 },
];

function buildFallers(pool: FallerItem[], count: number, wave: number): FallerInstance[] {
  return Array.from({ length: count }, (_, i) => {
    const n = (wave * 31 + i * 47) % 997;
    const slot = FALLER_SLOTS[(i + wave * 3) % FALLER_SLOTS.length]!;
    const pick = pool[(wave + i * 2) % pool.length]!;
    return {
      glyph: pick.glyph,
      kind: pick.kind ?? "emoji",
      left: Math.min(96, Math.max(2, slot.left + ((n % 11) - 5))),
      startTop: slot.startTop + ((n % 13) - 6),
      delay: i * 0.22 + (n % 7) * 0.08,
      duration: 3.2 + (n % 9) * 0.45,
      rotate: -40 + (n % 80),
      size: 0.82 + (n % 5) * 0.14,
      drift: -45 + (n % 90),
    };
  });
}

export function SectionShell({
  id,
  className = "",
  fallers,
  fallerCount = 12,
  children,
  as = "section",
}: {
  id?: string;
  className?: string;
  fallers?: FallerItem[];
  fallerCount?: number;
  children: ReactNode;
  as?: "section" | "div";
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.06, once: false });
  const [wave, setWave] = useState(0);
  const wasInView = useRef(false);

  useEffect(() => {
    if (inView && !wasInView.current) {
      setWave((w) => w + 1);
    }
    wasInView.current = inView;
  }, [inView]);

  const items = useMemo(
    () => (fallers ? buildFallers(fallers, fallerCount, wave) : []),
    [fallers, fallerCount, wave],
  );

  const Tag = as as ElementType;

  return (
    <Tag ref={ref} id={id} className={`cadeo-section-shell ${className}`.trim()}>
      {fallers && (
        <div className="cadeo-fallers-layer" aria-hidden>
          <AnimatePresence>
            {inView &&
              items.map((item, i) => (
                <motion.span
                  key={`${wave}-${i}`}
                  className={`cadeo-faller-sticker ${item.kind === "text" ? "cadeo-faller-sticker--text" : ""}`}
                  style={{
                    left: `${item.left}%`,
                    fontSize: `${item.size}rem`,
                  }}
                  initial={{
                    top: `${item.startTop}%`,
                    opacity: 0,
                    x: 0,
                    rotate: item.rotate,
                  }}
                  animate={{
                    top: "108%",
                    opacity: [0, 0.95, 0.95, 0.7, 0],
                    x: item.drift,
                    rotate: item.rotate + 160,
                  }}
                  transition={{
                    duration: item.duration,
                    delay: item.delay,
                    ease: [0.12, 0.04, 0.22, 1],
                  }}
                >
                  {item.glyph}
                </motion.span>
              ))}
          </AnimatePresence>
        </div>
      )}
      <div className="cadeo-section-shell__content">{children}</div>
    </Tag>
  );
}
