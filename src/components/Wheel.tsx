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

  const colors = [
    primaryColor,
    secondaryColor,
    "#FFD166",
    "#06D6A0",
    "#118AB2",
    "#EF476F",
    "#8338EC",
    "#FFBE0B",
  ];

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
    if (targetPrizeId && !spinning) {
      spin();
    }
  }, [targetPrizeId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (slices.length === 0) {
    return (
      <p className="text-center text-gray-500">Aucun prix configuré pour le moment.</p>
    );
  }

  const gradientStops = slices
    .map((slice, i) => {
      const color = colors[i % colors.length];
      return `${color} ${slice.start}deg ${slice.end}deg`;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-2xl">▼</div>
        <div
          ref={wheelRef}
          className="h-72 w-72 rounded-full border-4 border-white shadow-xl transition-transform duration-[4500ms] ease-out sm:h-80 sm:w-80"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(from 0deg, ${gradientStops})`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-sm font-bold shadow-md">
            SPIN
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={spin}
        disabled={spinning}
        className="rounded-full px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {spinning ? "En cours..." : "Tourner la roue !"}
      </button>
    </div>
  );
}
