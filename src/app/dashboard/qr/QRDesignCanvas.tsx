"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_SIZE,
  computeElementBounds,
  getRenderContext,
  hitTestElement,
  hitTestResizeHandle,
  patchLayoutElement,
  renderDesignToCanvas,
  snapToAlignmentGrid,
  type DesignElementKey,
  type QRDesignConfig,
  type QRDesignTemplate,
  type ResizeHandle,
  type VisitCardSide,
} from "@/lib/qr-design";

type DragMode = "move" | "resize";

type DragState = {
  mode: DragMode;
  key: DesignElementKey;
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  startPlacement: { x: number; y: number; scale: number };
};

const ELEMENT_KEYS: DesignElementKey[] = ["logo", "name", "qr", "tagline"];
const RENDER_DEBOUNCE_MS = 120;

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
  onEditStart,
  onEditEnd,
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
  onEditStart?: () => void;
  onEditEnd?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderVersion = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const selectedRef = useRef(selected);
  const editingRef = useRef(false);
  const [drag, setDrag] = useState<DragState | null>(null);

  const canvasBox = CANVAS_SIZE[template];

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const sideCtx =
    template !== "qr" ? getRenderContext(design, template, visitCardSide) : null;

  const renderPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const version = ++renderVersion.current;
    const currentDrag = dragRef.current;
    const currentSelected = selectedRef.current;

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
            ? {
                selected: currentSelected,
                showGuides: Boolean(currentSelected) || Boolean(currentDrag),
                showGrid: currentDrag?.mode === "move",
              }
            : undefined,
      });
    } finally {
      void version;
    }
  }, [businessName, design, displayUrl, editable, qrBg, qrFg, template, visitCardSide]);

  useEffect(() => {
    const delay = drag ? 0 : RENDER_DEBOUNCE_MS;
    const timer = window.setTimeout(() => {
      void renderPreview();
    }, delay);
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

  const beginEdit = () => {
    if (editingRef.current) return;
    editingRef.current = true;
    onEditStart?.();
  };

  const finishEdit = () => {
    if (!editingRef.current) return;
    editingRef.current = false;
    onEditEnd?.();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editable || template === "qr") return;
    const pt = clientToCanvas(event.clientX, event.clientY);
    if (!pt) return;

    const bounds = getBounds();
    if (selected && bounds[selected]) {
      const handle = hitTestResizeHandle(pt.x, pt.y, bounds[selected]);
      if (handle) {
        beginEdit();
        const layout =
          template === "table_sticker"
            ? design.layouts.table_sticker
            : design.visitCard[visitCardSide].layout;
        setDrag({
          mode: "resize",
          key: selected,
          handle,
          startX: pt.x,
          startY: pt.y,
          startPlacement: { ...layout[selected] },
        });
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
    }

    const hit = hitTestElement(pt.x, pt.y, bounds);
    if (hit) {
      onSelect(hit);
      beginEdit();
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
      const rawX = drag.startPlacement.x + dx;
      const rawY = drag.startPlacement.y + dy;
      const snapped = snapToAlignmentGrid(rawX, rawY);
      patchElement(drag.key, snapped);
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
    if (drag?.mode === "move") {
      const layout =
        template === "table_sticker"
          ? design.layouts.table_sticker[drag.key]
          : design.visitCard[visitCardSide].layout[drag.key];
      const snapped = snapToAlignmentGrid(layout.x, layout.y);
      if (snapped.x !== layout.x || snapped.y !== layout.y) {
        patchElement(drag.key, snapped);
      }
    }
    if (drag) {
      setDrag(null);
      finishEdit();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full touch-none ${editable && template !== "qr" ? "cursor-grab active:cursor-grabbing" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    />
  );
}

export { ELEMENT_KEYS };
