"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Prize } from "@/lib/types";
import { prizeSliceAngles } from "@/lib/wheel";

interface WheelProps {
  prizes: Prize[];
  primaryColor: string;
  secondaryColor: string;
  onSpinComplete: (prize: Prize) => void;
  spinning: boolean;
  setSpinning: (v: boolean) => void;
  targetPrizeId?: string;
}

export function Wheel({
  prizes,
  primaryColor,
  secondaryColor,
  onSpinComplete,
  spinning,
  setSpinning,
  targetPrizeId,
}: WheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const slices = prizeSliceAngles(prizes);

  const colors = [primaryColor, secondaryColor, "#3f3f46", "#52525b", "#71717a", "#a1a1aa"];

  const spin = useCallback(() => {
    if (spinning || slices.length === 0) return;
    setSpinning(true);

    const target = targetPrizeId
      ? slices.find((s) => s.prize.id === targetPrizeId) ?? slices[0]
      : slices[Math.floor(Math.random() * slices.length)];

    const sliceMid = (target.start + target.end) / 2;
    const extraTurns = 5 * 360;
    const finalRotation = extraTurns + (360 - sliceMid);
    setRotation((prev) => prev + finalRotation);

    setTimeout(() => {
      setSpinning(false);
      onSpinComplete(target.prize);
    }, 4500);
  }, [spinning, slices, targetPrizeId, setSpinning, onSpinComplete]);

  useEffect(() => {
    if (targetPrizeId && !spinning) spin();
  }, [targetPrizeId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (slices.length === 0) {
    return <p className="text-center text-sm text-zinc-500">Aucun prix configuré.</p>;
  }

  const gradientStops = slices
    .map((slice, i) => {
      const color = colors[i % colors.length];
      return `${color} ${slice.start}deg ${slice.end}deg`;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-lg text-zinc-900">▼</div>
        <div
          ref={wheelRef}
          className="h-64 w-64 rounded-full border-2 border-zinc-200 transition-transform duration-[4500ms] ease-out sm:h-72 sm:w-72"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(from 0deg, ${gradientStops})`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-zinc-200 bg-white text-[10px] font-bold uppercase tracking-wide text-zinc-700">
            Spin
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={spin}
        disabled={spinning}
        className="rounded-sm px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        style={{ backgroundColor: primaryColor }}
      >
        {spinning ? "En cours…" : "Tourner"}
      </button>
    </div>
  );
}
