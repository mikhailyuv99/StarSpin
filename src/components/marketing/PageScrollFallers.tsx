"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo } from "react";
import { FALLER_POOLS } from "./faller-pools";

type FallerConfig = {
  side: "left" | "right";
  inset: number;
  anchor: number;
  speed: number;
  rotate: number;
  size: number;
};

const FALLER_CONFIGS: FallerConfig[] = [
  { side: "left", inset: 3, anchor: 0.12, speed: 0.42, rotate: -12, size: 1.05 },
  { side: "left", inset: 5, anchor: 0.48, speed: 0.28, rotate: 8, size: 0.92 },
  { side: "left", inset: 2, anchor: 0.78, speed: 0.55, rotate: -6, size: 1.1 },
  { side: "right", inset: 3, anchor: 0.2, speed: 0.35, rotate: 14, size: 0.98 },
  { side: "right", inset: 6, anchor: 0.55, speed: 0.48, rotate: -10, size: 1.02 },
  { side: "right", inset: 4, anchor: 0.86, speed: 0.32, rotate: 6, size: 0.9 },
];

function ScrollFaller({
  config,
  glyph,
  kind,
}: {
  config: FallerConfig;
  glyph: string;
  kind?: "emoji" | "text";
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (value) => value * config.speed);

  return (
    <motion.span
      className={`cadeo-page-faller ${kind === "text" ? "cadeo-page-faller--text" : ""}`}
      style={{
        [config.side]: `${config.inset}%`,
        top: `${config.anchor * 100}vh`,
        y,
        rotate: config.rotate,
        fontSize: `${config.size}rem`,
      }}
    >
      {glyph}
    </motion.span>
  );
}

export function PageScrollFallers() {
  const pool = useMemo(
    () => [...FALLER_POOLS.pricing, ...FALLER_POOLS.hero, ...FALLER_POOLS.pillars],
    [],
  );

  return (
    <div className="cadeo-page-fallers" aria-hidden>
      {FALLER_CONFIGS.map((config, i) => {
        const pick = pool[i % pool.length]!;
        return (
          <ScrollFaller
            key={`${config.side}-${config.anchor}`}
            config={config}
            glyph={pick.glyph}
            kind={"kind" in pick ? pick.kind : undefined}
          />
        );
      })}
    </div>
  );
}
