"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Prize } from "@/lib/types";
import {
  describeSlice,
  polarToCartesian,
  prizeSliceAngles,
  truncateLabel,
} from "@/lib/wheel";

interface WheelProps {
  prizes: Prize[];
  primaryColor: string;
  secondaryColor: string;
  onSpinComplete: (prize: Prize) => void;
  spinning: boolean;
  setSpinning: (v: boolean) => void;
  targetPrizeId?: string;
  hideSpinButton?: boolean;
}

export function Wheel({
  prizes,
  primaryColor,
  secondaryColor,
  onSpinComplete,
  spinning,
  setSpinning,
  targetPrizeId,
  hideSpinButton = false,
}: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const [wheelSize, setWheelSize] = useState(280);
  const spunRef = useRef<string | undefined>(undefined);
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
      ? (slices.find((s) => s.prize.id === targetPrizeId) ?? slices[0])
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
    if (targetPrizeId && !spinning && spunRef.current !== targetPrizeId) {
      spunRef.current = targetPrizeId;
      spin();
    }
  }, [targetPrizeId, spinning, spin]);

  if (slices.length === 0) {
    return <p className="text-center text-sm text-zinc-500">Aucun prix configuré.</p>;
  }

  const cx = wheelSize / 2;
  const cy = wheelSize / 2;
  const r = wheelSize / 2 - 6;
  const hubSize = Math.round(wheelSize * 0.2);
  const fontSize = slices.length > 8 ? 8 : slices.length > 5 ? 9 : 11;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
        <div
          className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 drop-shadow-md"
          aria-hidden
        >
          <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
            <path d="M14 24L2 4h24L14 24z" fill="#18181b" />
            <path d="M14 21L5 7h18L14 21z" fill="#fff" />
          </svg>
        </div>

        <div
          className="rounded-full border-[3px] border-white/90 shadow-2xl transition-transform duration-[4500ms] ease-[cubic-bezier(0.15,0.85,0.25,1)]"
          style={{
            width: wheelSize,
            height: wheelSize,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <svg
            width={wheelSize}
            height={wheelSize}
            viewBox={`0 0 ${wheelSize} ${wheelSize}`}
            className="block"
          >
            <circle cx={cx} cy={cy} r={r + 3} fill="#18181b" />
            {slices.map((slice, i) => {
              const mid = (slice.start + slice.end) / 2;
              const textPos = polarToCartesian(cx, cy, r * 0.62, mid);
              return (
                <g key={slice.prize.id}>
                  <path
                    d={describeSlice(cx, cy, r, slice.start, slice.end)}
                    fill={colors[i % colors.length]}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    transform={`rotate(${mid}, ${textPos.x}, ${textPos.y})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={fontSize}
                    fontWeight={700}
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
                  >
                    {truncateLabel(slice.prize.label)}
                  </text>
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={hubSize / 2 + 2} fill="#fff" stroke="#e4e4e7" strokeWidth={2} />
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-[10px] font-bold uppercase tracking-wider text-zinc-800 shadow-sm"
            style={{ width: hubSize, height: hubSize }}
          >
            GO
          </div>
        </div>
      </div>

      {!hideSpinButton && (
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="public-touch-target w-full max-w-xs rounded-sm px-6 font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
        >
          {spinning ? "En cours…" : "Tourner la roue"}
        </button>
      )}
    </div>
  );
}
