"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_SIZE,
  computeElementBounds,
  elementKey,
  getSideDesign,
  hitTestElement,
  hitTestResizeHandle,
  hitTestRotationHandle,
  patchElementPlacement,
  patchTextBox,
  renderDesignToCanvas,
  snapToAlignmentGrid,
  snapRotation,
  type ElementPlacement,
  type QRDesignConfig,
  type QRDesignTemplate,
  type ResizeHandle,
  type SelectedElement,
  type VisitCardSide,
} from "@/lib/qr-design";

type DragMode = "move" | "resize" | "rotate";

type DragState = {
  mode: DragMode;
  target: SelectedElement;
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  startAngle: number;
  startPlacement: ElementPlacement;
};

const RENDER_DEBOUNCE_MS = 120;

function getPlacement(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  target: SelectedElement,
): ElementPlacement {
  const side = getSideDesign(design, template, visitCardSide);
  if (target.kind === "text") {
    return side.textBoxes.find((b) => b.id === target.id)!.placement;
  }
  return side[target.kind];
}

function patchTarget(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  target: SelectedElement,
  patch: Partial<ElementPlacement>,
): QRDesignConfig {
  if (target.kind === "text") {
    return patchTextBox(design, template, visitCardSide, target.id, {
      placement: patch,
    });
  }
  return patchElementPlacement(design, template, visitCardSide, target.kind, patch);
}

export function QRDesignCanvas({
  template,
  visitCardSide = "front",
  displayUrl,
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
  qrFg: string;
  qrBg: string;
  design: QRDesignConfig;
  editable: boolean;
  selected: SelectedElement | null;
  onSelect: (key: SelectedElement | null) => void;
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

  const side =
    template !== "qr" ? getSideDesign(design, template, visitCardSide) : null;

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
  }, [design, displayUrl, editable, qrBg, qrFg, template, visitCardSide]);

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
    if (template === "qr" || !side) return {};
    return computeElementBounds(template, side, canvasBox.width, canvasBox.height, {
      hasLogo: Boolean(design.logoUrl),
    });
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

  const patchElement = (target: SelectedElement, patch: Partial<ElementPlacement>) => {
    if (template === "qr") return;
    onLayoutChange(patchTarget(design, template, visitCardSide, target, patch));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editable || template === "qr") return;
    const pt = clientToCanvas(event.clientX, event.clientY);
    if (!pt) return;

    const bounds = getBounds();

    if (selected) {
      const key = elementKey(selected);
      const box = bounds[key];
      if (box && hitTestRotationHandle(pt.x, pt.y, box)) {
        const placement = getPlacement(design, template, visitCardSide, selected);
        beginEdit();
        setDrag({
          mode: "rotate",
          target: selected,
          startX: pt.x,
          startY: pt.y,
          startAngle: placement.rotation,
          startPlacement: { ...placement },
        });
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
      if (box) {
        const handle = hitTestResizeHandle(pt.x, pt.y, box);
        if (handle) {
          const placement = getPlacement(design, template, visitCardSide, selected);
          beginEdit();
          setDrag({
            mode: "resize",
            target: selected,
            handle,
            startX: pt.x,
            startY: pt.y,
            startAngle: placement.rotation,
            startPlacement: { ...placement },
          });
          event.currentTarget.setPointerCapture(event.pointerId);
          return;
        }
      }
    }

    const hit = hitTestElement(pt.x, pt.y, bounds);
    if (hit) {
      onSelect(hit);
      const placement = getPlacement(design, template, visitCardSide, hit);
      beginEdit();
      setDrag({
        mode: "move",
        target: hit,
        startX: pt.x,
        startY: pt.y,
        startAngle: placement.rotation,
        startPlacement: { ...placement },
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
      const snapped = snapToAlignmentGrid(
        drag.startPlacement.x + dx,
        drag.startPlacement.y + dy,
      );
      patchElement(drag.target, snapped);
      return;
    }

    if (drag.mode === "rotate") {
      const sideDesign = getSideDesign(design, template, visitCardSide);
      const bounds = computeElementBounds(template, sideDesign, canvasBox.width, canvasBox.height, {
        hasLogo: Boolean(design.logoUrl),
      });
      const box = bounds[elementKey(drag.target)];
      if (!box) return;
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      const startRad = Math.atan2(drag.startY - cy, drag.startX - cx);
      const currentRad = Math.atan2(pt.y - cy, pt.x - cx);
      const delta = ((currentRad - startRad) * 180) / Math.PI;
      patchElement(drag.target, { rotation: snapRotation(drag.startAngle + delta) });
      return;
    }

    const sideDesign = getSideDesign(design, template, visitCardSide);
    const bounds = computeElementBounds(template, sideDesign, canvasBox.width, canvasBox.height, {
      hasLogo: Boolean(design.logoUrl),
    });
    const box = bounds[elementKey(drag.target)];
    if (!box) return;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const startDist = Math.hypot(drag.startX - cx, drag.startY - cy);
    const currentDist = Math.hypot(pt.x - cx, pt.y - cy);
    if (startDist > 0) {
      patchElement(drag.target, {
        scale: drag.startPlacement.scale * (currentDist / startDist),
      });
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag || template === "qr") return;
    if (drag.mode === "move") {
      const placement = getPlacement(design, template, visitCardSide, drag.target);
      const snapped = snapToAlignmentGrid(placement.x, placement.y);
      if (snapped.x !== placement.x || snapped.y !== placement.y) {
        patchElement(drag.target, snapped);
      }
    } else if (drag.mode === "rotate") {
      const placement = getPlacement(design, template, visitCardSide, drag.target);
      const snappedRot = snapRotation(placement.rotation);
      if (snappedRot !== placement.rotation) {
        patchElement(drag.target, { rotation: snappedRot });
      }
    }
    setDrag(null);
    finishEdit();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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
