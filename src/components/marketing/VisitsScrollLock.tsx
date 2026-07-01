"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";

export type VisitCard = {
  label: string;
  action: string;
  pill: string;
  brand: SocialBrand;
};

function VisitCardView({ visit, index }: { visit: VisitCard; index: number }) {
  return (
    <div className="cadeo-visit-card cadeo-visit-card--scroll">
      <span className="cadeo-visit-step">{String(index + 1).padStart(2, "0")}</span>
      <p className="cadeo-visit-label">{visit.label}</p>
      <div className="cadeo-visit-xp" aria-hidden>
        <div className="cadeo-visit-xp-fill" style={{ width: `${(index + 1) * 25}%` }} />
      </div>
      <span className={`cadeo-visit-pill ${visit.pill}`}>
        <span className="cadeo-visit-pill-icon">
          <SocialIcon brand={visit.brand} size={24} />
        </span>
        <span className="cadeo-visit-pill-text">{visit.action}</span>
      </span>
    </div>
  );
}

function ScrollCard({
  visit,
  index,
  total,
  progress,
}: {
  visit: VisitCard;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const step = 1 / total;
  const fade = step * 0.22;
  const inStart = Math.max(0, index * step - fade * 0.35);
  const inEnd = index * step + fade;
  const outStart = (index + 1) * step - fade;
  const outEnd = (index + 1) * step + fade * 0.15;
  const isLast = index === total - 1;

  const opacity = useTransform(progress, (p) => {
    if (p < inStart) return 0;
    if (p < inEnd) return (p - inStart) / (inEnd - inStart);
    if (isLast || p < outStart) return 1;
    if (p < outEnd) return 1 - (p - outStart) / (outEnd - outStart);
    return 0;
  });

  const y = useTransform(progress, (p) => {
    if (p < inStart) return 56;
    if (p < inEnd) return 56 * (1 - (p - inStart) / (inEnd - inStart));
    return 0;
  });

  const scale = useTransform(progress, (p) => {
    if (p < inStart) return 0.94;
    if (p < inEnd) return 0.94 + 0.06 * ((p - inStart) / (inEnd - inStart));
    return 1;
  });

  return (
    <motion.div
      className="cadeo-visits-scroll-card"
      style={{ opacity, y, scale, zIndex: index + 1 }}
    >
      <VisitCardView visit={visit} index={index} />
    </motion.div>
  );
}

export function VisitsScrollLock({ visits }: { visits: VisitCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={ref}
      className="cadeo-visits-scroll-track"
      style={{ height: `${visits.length * 85}vh` }}
    >
      <div className="cadeo-visits-scroll-pin">
        <div className="cadeo-visits-scroll-stage">
          {visits.map((visit, i) => (
            <ScrollCard
              key={visit.label}
              visit={visit}
              index={i}
              total={visits.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
