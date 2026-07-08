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
import { WheelSliceLabels, wheelClipPrefix } from "@/components/WheelSliceLabels";

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
  /** Fixed wheel diameter (px). Used in the dashboard phone preview. */
  sizePx?: number;
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
}: WheelProps) {
  const t = useTranslations();
  const [dynamicSize, setDynamicSize] = useState(() => sizePx ?? 280);
  const wheelSize = sizePx ?? dynamicSize;
  const spunRef = useRef<string | undefined>(undefined);
  const slices = prizeEqualSliceAngles(prizes);
  const clipPrefix = wheelClipPrefix(slices.map((s) => s.prize));

  const cx = 50;
  const cy = 50;
  const r = 44;
  const pointerW = Math.round(wheelSize * 0.22);
  const pointerH = Math.round(wheelSize * 0.17);

  const [rotation, setRotation] = useState(0);

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

  const spin = useCallback(() => {
    if (spinning || slices.length === 0) return;
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

    const sliceMid = (target.start + target.end) / 2;
    const extraTurns = 5 * 360;
    const finalRotation = extraTurns + (360 - sliceMid);
    setRotation((prev) => prev + finalRotation);

    setTimeout(() => {
      setSpinning(false);
      onSpinComplete(target.prize);
    }, 4500);
  }, [spinning, slices, targetPrizeId, setSpinning, onSpinComplete, prizes]);

  useEffect(() => {
    if (targetPrizeId && !spinning && spunRef.current !== targetPrizeId) {
      spunRef.current = targetPrizeId;
      spin();
    }
  }, [targetPrizeId, spinning, spin]);

  if (slices.length === 0) {
    return <p className="text-center text-sm font-semibold text-muted">{t("public.wheelEmpty")}</p>;
  }

  return (
    <div className="public-wheel-stage">
      <div className="marketing-wheel-wrap" style={{ width: wheelSize, height: wheelSize }}>
        <div className="marketing-wheel-pointer" aria-hidden>
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
              transition: "transform 4500ms cubic-bezier(0.15, 0.85, 0.25, 1)",
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
              clipIdPrefix={clipPrefix}
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
          disabled={spinning}
          className="public-btn public-touch-target max-w-xs"
          style={{ backgroundColor: primaryColor, color: contrastTextColor(primaryColor) }}
        >
          {spinning ? t("public.wheelSpinning") : t("public.wheelSpin")}
        </button>
      )}
    </div>
  );
}
