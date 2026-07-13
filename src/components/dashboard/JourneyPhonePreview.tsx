"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  PHONE_PREVIEW_DESIGN_HEIGHT,
  PHONE_PREVIEW_DESIGN_WIDTH,
} from "@/lib/preview-wheel-size";

export {
  PHONE_PREVIEW_DESIGN_HEIGHT,
  PHONE_PREVIEW_DESIGN_WIDTH,
  computePreviewWheelSize,
} from "@/lib/preview-wheel-size";

type PreviewLayout = {
  scale: number;
  offsetX: number;
  screenW: number;
  screenH: number;
};

/**
 * Renders the journey at the exact mobile viewport (390×844), then scales it
 * uniformly to fit the phone bezel. Same pixel ratios as a real customer phone.
 */
export function JourneyPhonePreview({
  children,
  remountKey,
}: {
  children: ReactNode;
  remountKey: string;
}) {
  const screenRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PreviewLayout>({
    scale: 0.712,
    offsetX: 0,
    screenW: 278,
    screenH: 529,
  });

  const fit = useCallback(() => {
    const screen = screenRef.current;
    const content = contentRef.current;
    if (!screen || !content) return;

    const sw = screen.clientWidth;
    const sh = screen.clientHeight;
    const cw = PHONE_PREVIEW_DESIGN_WIDTH;
    if (!sw || !sh) return;

    /** Always fill phone width — tall steps are compacted in PublicFlow, not shrunk here. */
    const scale = sw / cw;

    setLayout({ scale, offsetX: 0, screenW: sw, screenH: sh });
  }, []);

  useEffect(() => {
    fit();
    const content = contentRef.current;
    const screen = screenRef.current;
    if (!content || !screen) return;

    const ro = new ResizeObserver(() => fit());
    ro.observe(content);
    ro.observe(screen);

    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    window.addEventListener("pj-preview-resize", onResize);

    const t1 = window.setTimeout(fit, 80);
    const t2 = window.setTimeout(fit, 380);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pj-preview-resize", onResize);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [fit, remountKey]);

  return (
    <div className="pj-phone">
      <span className="pj-phone-notch" aria-hidden />
      <div className="pj-phone-screen" ref={screenRef}>
        <div
          className="pj-phone-clip"
          style={{ width: layout.screenW, height: layout.screenH }}
        >
          <div
            className="pj-phone-scaler"
            style={{
              width: PHONE_PREVIEW_DESIGN_WIDTH,
              height: PHONE_PREVIEW_DESIGN_HEIGHT,
              transform: `translate(${layout.offsetX}px, 0) scale(${layout.scale})`,
              ["--pj-preview-svh" as string]: `${PHONE_PREVIEW_DESIGN_HEIGHT}px`,
            }}
          >
            <div ref={contentRef} className="pj-phone-viewport">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
