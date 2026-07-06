"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_SIZE,
  computeElementBounds,
  getRenderContext,
  hitTestElement,
  hitTestResizeHandle,
  patchLayoutElement,
  PREVIEW_MAX_WIDTH,
  renderDesignToCanvas,
  type DesignElementKey,
  type QRDesignConfig,
  type QRDesignTemplate,
  type VisitCardSide,
} from "@/lib/qr-design";

type DragMode = "move" | "resize";

type DragState = {
  mode: DragMode;
  key: DesignElementKey;
  startX: number;
  startY: number;
  startPlacement: { x: number; y: number; scale: number };
};

const ELEMENT_KEYS: DesignElementKey[] = ["logo", "name", "qr", "tagline"];

export function QRDesignCanvas({
  template,
  visitCardSide = "front",
  displayUrl,
  businessName,
  qrFg,
  qrBg,
  design,
  editable,
  selected,
  onSelect,
  onLayoutChange,
  onRenderingChange,
}: {
  template: QRDesignTemplate;
  visitCardSide?: VisitCardSide;
  displayUrl: string;
  businessName: string;
  qrFg: string;
  qrBg: string;
  design: QRDesignConfig;
  editable: boolean;
  selected: DesignElementKey | null;
  onSelect: (key: DesignElementKey | null) => void;
  onLayoutChange: (next: QRDesignConfig) => void;
  onRenderingChange?: (rendering: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderVersion = useRef(0);
  const [drag, setDrag] = useState<DragState | null>(null);

  const canvasBox = CANVAS_SIZE[template];
  const previewWidth = PREVIEW_MAX_WIDTH[template];

  const sideCtx =
    template !== "qr" ? getRenderContext(design, template, visitCardSide) : null;

  const renderPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const version = ++renderVersion.current;
    onRenderingChange?.(true);
    try {
      await renderDesignToCanvas(canvas, {
        template,
        url: displayUrl,
        businessName,
        qrFg,
        qrBg,
        design: { ...design, template },
        visitCardSide,
        editor:
          editable && template !== "qr"
            ? { selected, showGuides: true }
            : undefined,
      });
    } finally {
      if (version === renderVersion.current) onRenderingChange?.(false);
    }
  }, [
    businessName,
    design,
    displayUrl,
    editable,
    onRenderingChange,
    qrBg,
    qrFg,
    selected,
    template,
    visitCardSide,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void renderPreview();
    }, drag ? 0 : 40);
    return () => window.clearTimeout(timer);
  }, [renderPreview, drag]);

  const clientToCanvas = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvasBox.width,
      y: ((clientY - rect.top) / rect.height) * canvasBox.height,
    };
  };

  const getBounds = () => {
    if (template === "qr" || !sideCtx) return {};
    return computeElementBounds(template, sideCtx, canvasBox.width, canvasBox.height, businessName, {
      hasLogo: Boolean(design.logoUrl),
    });
  };

  const patchElement = (key: DesignElementKey, patch: Partial<{ x: number; y: number; scale: number }>) => {
    if (template === "qr") return;
    onLayoutChange(patchLayoutElement(design, template, key, patch, visitCardSide));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editable || template === "qr") return;
    const pt = clientToCanvas(event.clientX, event.clientY);
    if (!pt) return;

    const bounds = getBounds();
    if (selected && bounds[selected] && hitTestResizeHandle(pt.x, pt.y, bounds[selected])) {
      const layout =
        template === "table_sticker"
          ? design.layouts.table_sticker
          : design.visitCard[visitCardSide].layout;
      setDrag({
        mode: "resize",
        key: selected,
        startX: pt.x,
        startY: pt.y,
        startPlacement: { ...layout[selected] },
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const hit = hitTestElement(pt.x, pt.y, bounds);
    if (hit) {
      onSelect(hit);
      const layout =
        template === "table_sticker"
          ? design.layouts.table_sticker
          : design.visitCard[visitCardSide].layout;
      setDrag({
        mode: "move",
        key: hit,
        startX: pt.x,
        startY: pt.y,
        startPlacement: { ...layout[hit] },
      });
      event.currentTarget.setPointerCapture(event.pointerId);
    } else {
      onSelect(null);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag || template === "qr") return;
    const pt = clientToCanvas(event.clientX, event.clientY);
    if (!pt) return;

    if (drag.mode === "move") {
      const dx = (pt.x - drag.startX) / canvasBox.width;
      const dy = (pt.y - drag.startY) / canvasBox.height;
      patchElement(drag.key, {
        x: drag.startPlacement.x + dx,
        y: drag.startPlacement.y + dy,
      });
      return;
    }

    const centerX = drag.startPlacement.x * canvasBox.width;
    const centerY = drag.startPlacement.y * canvasBox.height;
    const startDist = Math.hypot(drag.startX - centerX, drag.startY - centerY);
    const currentDist = Math.hypot(pt.x - centerX, pt.y - centerY);
    if (startDist > 0) {
      patchElement(drag.key, {
        scale: drag.startPlacement.scale * (currentDist / startDist),
      });
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag) {
      setDrag(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`block touch-none ${editable && template !== "qr" ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{
        width: previewWidth,
        maxWidth: "100%",
        height: "auto",
        aspectRatio: `${canvasBox.width} / ${canvasBox.height}`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    />
  );
}

export { ELEMENT_KEYS };
