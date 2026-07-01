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
  const [wheelSize, setWheelSize] = useState(280);
  const slices = prizeSliceAngles(prizes);

  const colors = [primaryColor, secondaryColor, "#3f3f46", "#52525b", "#71717a", "#a1a1aa"];

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setWheelSize(Math.min(Math.max(w * 0.78, 240), 320));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  const hubSize = Math.round(wheelSize * 0.18);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
        <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-xl text-zinc-900">
          ▼
        </div>
        <div
          ref={wheelRef}
          className="rounded-full border-2 border-zinc-200 transition-transform duration-[4500ms] ease-out"
          style={{
            width: wheelSize,
            height: wheelSize,
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(from 0deg, ${gradientStops})`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-sm border border-zinc-200 bg-white text-[10px] font-bold uppercase tracking-wide text-zinc-700"
            style={{ width: hubSize, height: hubSize }}
          >
            Spin
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={spin}
        disabled={spinning}
        className="public-touch-target w-full max-w-xs rounded-sm px-6 font-semibold text-white disabled:opacity-40"
        style={{ backgroundColor: primaryColor }}
      >
        {spinning ? "En cours…" : "Tourner la roue"}
      </button>
    </div>
  );
}
