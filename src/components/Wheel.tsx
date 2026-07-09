"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Prize } from "@/lib/types";
import { useTranslations } from "@/i18n/client";
import { WheelPointer } from "@/components/WheelPointer";
import {
  contrastTextColor,
  describeSlice,
  pickWeightedPrize,
  prizeEqualSliceAngles,
} from "@/lib/wheel";
import { WheelSliceLabels } from "@/components/WheelSliceLabels";
import {
  computeSpinDelta,
  easeOutQuart,
  equalSliceBoundaryCrossings,
  type WheelSlice,
} from "@/lib/wheel-spin";

export interface WheelColors {
  palette: string[];
  stroke: string;
  label: string;
  rim: string;
  hub: string;
  hubDot: string;
  pointer: string;
  pointerInner: string;
}

interface WheelProps {
  prizes: Prize[];
  primaryColor: string;
  secondaryColor: string;
  onSpinComplete: (prize: Prize) => void;
  spinning: boolean;
  setSpinning: (v: boolean) => void;
  targetPrizeId?: string;
  hideSpinButton?: boolean;
  colors?: WheelColors;
  sizePx?: number;
  spinButtonLabel?: string;
  spinningLabel?: string;
}

const DEFAULT_WHEEL_COLORS: WheelColors = {
  palette: ["#f5e08e", "#d8ccf5", "#f48fb1", "#a8e6cf", "#b8cfe8", "#f4a89a"],
  stroke: "#0a0a0a",
  label: "#0a0a0a",
  rim: "#0a0a0a",
  hub: "#ffffff",
  hubDot: "#f5e08e",
  pointer: "#0a0a0a",
  pointerInner: "#f5e08e",
};

const SPIN_MS = 4500;

export function Wheel({
  prizes,
  primaryColor,
  onSpinComplete,
  spinning,
  setSpinning,
  targetPrizeId,
  hideSpinButton = false,
  colors = DEFAULT_WHEEL_COLORS,
  sizePx,
  spinButtonLabel,
  spinningLabel,
}: WheelProps) {
  const t = useTranslations();
  const [dynamicSize, setDynamicSize] = useState(() => sizePx ?? 280);
  const wheelSize = sizePx ?? dynamicSize;
  const spunRef = useRef<string | undefined>(undefined);
  const rafRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const pointerElRef = useRef<HTMLDivElement>(null);
  const tickSideRef = useRef<"l" | "r">("l");
  const slices = prizeEqualSliceAngles(prizes) as WheelSlice[];

  const cx = 50;
  const cy = 50;
  const r = 44;
  const pointerW = Math.round(wheelSize * 0.22);
  const pointerH = Math.round(wheelSize * 0.17);

  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);

  const bumpPointer = useCallback(() => {
    const el = pointerElRef.current;
    if (!el) return;
    tickSideRef.current = tickSideRef.current === "l" ? "r" : "l";
    const cls =
      tickSideRef.current === "l"
        ? "marketing-wheel-pointer--tick-l"
        : "marketing-wheel-pointer--tick-r";
    el.classList.remove(
      "marketing-wheel-pointer--tick-l",
      "marketing-wheel-pointer--tick-r",
    );
    void el.offsetWidth;
    el.classList.add(cls);
  }, []);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (sizePx != null) return;
    const update = () => {
      const w = window.innerWidth;
      setDynamicSize(Math.min(Math.max(w - 72, 260), 320));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [sizePx]);

  useEffect(() => {
    if (!targetPrizeId) {
      spunRef.current = undefined;
    }
  }, [targetPrizeId]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const runSpinAnimation = useCallback(
    (target: WheelSlice, onDone: () => void) => {
      const sliceMid = (target.start + target.end) / 2;
      const startRotation = rotationRef.current;
      const delta = computeSpinDelta(startRotation, sliceMid);
      const endRotation = startRotation + delta;
      const startTime = performance.now();
      let lastFrameRotation = startRotation;

      setAnimating(true);

      const frame = (now: number) => {
        const tNorm = Math.min(1, (now - startTime) / SPIN_MS);
        const eased = easeOutQuart(tNorm);
        const current = startRotation + delta * eased;
        setRotation(current);

        const crossings = equalSliceBoundaryCrossings(
          lastFrameRotation,
          current,
          slices.length,
        );
        if (crossings > 0) {
          bumpPointer();
        }
        lastFrameRotation = current;

        if (tNorm < 1) {
          rafRef.current = requestAnimationFrame(frame);
        } else {
          setRotation(endRotation);
          rotationRef.current = endRotation;
          setAnimating(false);
          rafRef.current = null;
          bumpPointer();
          onDone();
        }
      };

      rafRef.current = requestAnimationFrame(frame);
    },
    [slices, bumpPointer],
  );

  const spin = useCallback(() => {
    if (spinning || animating || slices.length === 0) return;
    setSpinning(true);

    const target = targetPrizeId
      ? (slices.find((s) => s.prize.id === targetPrizeId) ?? slices[0])
      : (() => {
          const picked = pickWeightedPrize(prizes);
          return picked
            ? (slices.find((s) => s.prize.id === picked.id) ?? slices[0])
            : slices[0];
        })();

    if (!target) {
      setSpinning(false);
      return;
    }

    runSpinAnimation(target, () => {
      setSpinning(false);
      onSpinComplete(target.prize);
    });
  }, [
    spinning,
    animating,
    slices,
    targetPrizeId,
    setSpinning,
    onSpinComplete,
    prizes,
    runSpinAnimation,
  ]);

  useEffect(() => {
    if (targetPrizeId && !spinning && !animating && spunRef.current !== targetPrizeId) {
      spunRef.current = targetPrizeId;
      spin();
    }
  }, [targetPrizeId, spinning, animating, spin]);

  if (slices.length === 0) {
    return <p className="text-center text-sm font-semibold text-muted">{t("public.wheelEmpty")}</p>;
  }

  return (
    <div className="public-wheel-stage">
      <div className="marketing-wheel-wrap" style={{ width: wheelSize, height: wheelSize }}>
        <div ref={pointerElRef} className="marketing-wheel-pointer" aria-hidden>
          <WheelPointer
            width={pointerW}
            height={pointerH}
            color={colors.pointer}
            innerColor={colors.pointerInner}
          />
        </div>

        <svg
          viewBox="0 0 100 100"
          width={wheelSize}
          height={wheelSize}
          className="marketing-wheel block"
          aria-hidden
        >
          <circle cx={cx} cy={cy} r={r + 3} fill={colors.hub} stroke={colors.rim} strokeWidth="2.5" />
          <g
            className="marketing-wheel__disc"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: animating ? "none" : undefined,
            }}
          >
            {slices.map((slice, i) => {
              const fill = colors.palette[i % colors.palette.length]!;

              return (
                <path
                  key={slice.prize.id}
                  d={describeSlice(cx, cy, r, slice.start, slice.end)}
                  fill={fill}
                  stroke={colors.stroke}
                  strokeWidth="1.25"
                />
              );
            })}
            <WheelSliceLabels
              slices={slices}
              cx={cx}
              cy={cy}
              r={r}
              color={colors.label}
            />
          </g>
          <circle cx={cx} cy={cy} r="9" fill={colors.hub} stroke={colors.rim} strokeWidth="2" />
          <circle cx={cx} cy={cy} r="3.5" fill={colors.hubDot} stroke={colors.stroke} strokeWidth="1.25" />
        </svg>
      </div>

      {!hideSpinButton && (
        <button
          type="button"
          onClick={spin}
          disabled={spinning || animating}
          className="public-btn public-touch-target max-w-xs"
          style={{ backgroundColor: primaryColor, color: contrastTextColor(primaryColor) }}
        >
          {spinning || animating
            ? (spinningLabel ?? t("public.wheelSpinning"))
            : (spinButtonLabel ?? t("public.wheelSpin"))}
        </button>
      )}
    </div>
  );
}
