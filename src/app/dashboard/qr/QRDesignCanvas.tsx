"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CANVAS_SIZE,
  computeElementBounds,
  elementKey,
  getSideDesign,
  hitTestElementsOrdered,
  patchElementPlacement,
  patchImage,
  patchTextBox,
  renderDesignToCanvas,
  snapRotation,
  snapToAlignmentGrid,
  type ElementBounds,
  type ElementPlacement,
  type QRDesignConfig,
  type QRDesignTemplate,
  type ResizeHandle,
  type SelectedElement,
  type VisitCardSide,
} from "@/lib/qr-design";

const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

// Local-space anchor of each handle within the (unrotated) selection box, 0..1.
const HANDLE_ANCHOR: Record<ResizeHandle, { x: number; y: number }> = {
  nw: { x: 0, y: 0 },
  n: { x: 0.5, y: 0 },
  ne: { x: 1, y: 0 },
  e: { x: 1, y: 0.5 },
  se: { x: 1, y: 1 },
  s: { x: 0.5, y: 1 },
  sw: { x: 0, y: 1 },
  w: { x: 0, y: 0.5 },
};

const CORNER_HANDLES = new Set<ResizeHandle>(["nw", "ne", "se", "sw"]);

type Pointer = { x: number; y: number };

type Gesture =
  | {
      mode: "move";
      target: SelectedElement;
      startPlacement: ElementPlacement;
      startPointer: Pointer;
      hits: SelectedElement[];
      moved: boolean;
      alreadySelected: boolean;
    }
  | {
      mode: "resize";
      target: SelectedElement;
      startPlacement: ElementPlacement;
      startCenter: Pointer;
      startDist: number;
    }
  | {
      mode: "rotate";
      target: SelectedElement;
      startPlacement: ElementPlacement;
      startCenter: Pointer;
      startAngle: number;
    }
  | {
      mode: "pinch";
      target: SelectedElement;
      startPlacement: ElementPlacement;
      startDist: number;
      startAngle: number;
      startMid: Pointer;
    };

const TAP_SLOP = 4; // canvas px of movement below which a press counts as a tap

function distance(a: Pointer, b: Pointer) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleBetween(a: Pointer, b: Pointer) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function boundsCenter(box: ElementBounds): Pointer {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const editingRef = useRef(false);
  const pointersRef = useRef<Map<number, Pointer>>(new Map());
  const gestureRef = useRef<Gesture | null>(null);
  const [cssScale, setCssScale] = useState(0);

  const canvasBox = CANVAS_SIZE[template];
  const isEditable = editable && template !== "qr";
  // All editable code paths are guarded by isEditable / template !== "qr".
  const layoutTemplate = template as Exclude<QRDesignTemplate, "qr">;
  const side = template !== "qr" ? getSideDesign(design, template, visitCardSide) : null;

  // ---- Canvas bitmap rendering (rAF-coalesced, uses image/QR caches) ----
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await renderDesignToCanvas(canvas, {
      template,
      url: displayUrl,
      qrFg,
      qrBg,
      design: { ...design, template },
      visitCardSide,
    });
  }, [design, displayUrl, qrBg, qrFg, template, visitCardSide]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => void render());
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // ---- Track rendered size so the overlay maps canvas px -> CSS px ----
  useLayoutEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setCssScale(rect.width / canvasBox.width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [canvasBox.width]);

  // ---- Helpers ----
  const clientToCanvas = (clientX: number, clientY: number): Pointer | null => {
    const el = overlayRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvasBox.width,
      y: ((clientY - rect.top) / rect.height) * canvasBox.height,
    };
  };

  const currentBounds = (): Record<string, ElementBounds> => {
    if (!side) return {};
    return computeElementBounds(layoutTemplate, side, canvasBox.width, canvasBox.height);
  };

  const placementOf = (target: SelectedElement): ElementPlacement | null => {
    if (!side) return null;
    if (target.kind === "qr") return side.qr;
    if (target.kind === "image") return side.images.find((i) => i.id === target.id)?.placement ?? null;
    return side.textBoxes.find((b) => b.id === target.id)?.placement ?? null;
  };

  const patchTarget = (target: SelectedElement, patch: Partial<ElementPlacement>) => {
    if (template === "qr") return;
    if (target.kind === "qr") {
      onLayoutChange(patchElementPlacement(design, layoutTemplate, visitCardSide, "qr", patch));
    } else if (target.kind === "image") {
      onLayoutChange(patchImage(design, layoutTemplate, visitCardSide, target.id, { placement: patch }));
    } else {
      onLayoutChange(patchTextBox(design, layoutTemplate, visitCardSide, target.id, { placement: patch }));
    }
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

  // ---- Pointer handling on the overlay ----
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditable) return;
    const pt = clientToCanvas(event.clientX, event.clientY);
    if (!pt) return;
    try {
      overlayRef.current?.setPointerCapture(event.pointerId);
    } catch {
      /* pointer may already be released (or synthetic) */
    }
    pointersRef.current.set(event.pointerId, pt);

    // Second finger down on a selected element -> pinch scale + rotate.
    if (pointersRef.current.size === 2 && selected) {
      const pts = [...pointersRef.current.values()];
      const placement = placementOf(selected);
      if (placement) {
        beginEdit();
        gestureRef.current = {
          mode: "pinch",
          target: selected,
          startPlacement: { ...placement },
          startDist: distance(pts[0], pts[1]) || 1,
          startAngle: angleBetween(pts[0], pts[1]),
          startMid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
        };
      }
      return;
    }

    if (pointersRef.current.size > 1) return;

    const bounds = currentBounds();

    // Grabbing a handle of the currently selected element.
    const handleEl = (event.target as HTMLElement).closest<HTMLElement>("[data-handle]");
    if (selected && handleEl) {
      const box = bounds[elementKey(selected)];
      const placement = placementOf(selected);
      if (box && placement) {
        const role = handleEl.dataset.handle;
        const center = boundsCenter(box);
        beginEdit();
        if (role === "rotate") {
          gestureRef.current = {
            mode: "rotate",
            target: selected,
            startPlacement: { ...placement },
            startCenter: center,
            startAngle: angleBetween(center, pt) - placement.rotation,
          };
        } else {
          gestureRef.current = {
            mode: "resize",
            target: selected,
            startPlacement: { ...placement },
            startCenter: center,
            startDist: distance(center, pt) || 1,
          };
        }
        return;
      }
    }

    // Otherwise hit-test the stack under the pointer.
    const hits = side ? hitTestElementsOrdered(pt.x, pt.y, side, bounds) : [];
    if (hits.length === 0) {
      onSelect(null);
      return;
    }

    // If the selected element is under the pointer, grab it (so it can be moved
    // even when it's not the topmost); re-tapping cycles to the one beneath.
    const selectedKey = selected ? elementKey(selected) : null;
    const alreadySelected = Boolean(
      selectedKey && hits.some((h) => elementKey(h) === selectedKey),
    );
    const target = alreadySelected
      ? hits.find((h) => elementKey(h) === selectedKey)!
      : hits[0];

    if (!alreadySelected) onSelect(target);

    const placement = placementOf(target);
    if (!placement) return;
    beginEdit();
    gestureRef.current = {
      mode: "move",
      target,
      startPlacement: { ...placement },
      startPointer: pt,
      hits,
      moved: false,
      alreadySelected,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    const pt = clientToCanvas(event.clientX, event.clientY);
    if (!pt) return;
    if (pointersRef.current.has(event.pointerId)) pointersRef.current.set(event.pointerId, pt);

    if (gesture.mode === "pinch") {
      const pts = [...pointersRef.current.values()];
      if (pts.length < 2) return;
      const curDist = distance(pts[0], pts[1]) || 1;
      const curAngle = angleBetween(pts[0], pts[1]);
      const curMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      patchTarget(gesture.target, {
        scale: gesture.startPlacement.scale * (curDist / gesture.startDist),
        rotation: snapRotation(gesture.startPlacement.rotation + (curAngle - gesture.startAngle)),
        x: gesture.startPlacement.x + (curMid.x - gesture.startMid.x) / canvasBox.width,
        y: gesture.startPlacement.y + (curMid.y - gesture.startMid.y) / canvasBox.height,
      });
      return;
    }

    if (gesture.mode === "resize") {
      const curDist = distance(gesture.startCenter, pt);
      patchTarget(gesture.target, {
        scale: gesture.startPlacement.scale * (curDist / gesture.startDist),
      });
      return;
    }

    if (gesture.mode === "rotate") {
      const rotation = angleBetween(gesture.startCenter, pt) - gesture.startAngle;
      patchTarget(gesture.target, { rotation: snapRotation(rotation) });
      return;
    }

    // move
    const dx = (pt.x - gesture.startPointer.x) / canvasBox.width;
    const dy = (pt.y - gesture.startPointer.y) / canvasBox.height;
    if (!gesture.moved && distance(pt, gesture.startPointer) > TAP_SLOP) gesture.moved = true;
    const snapped = snapToAlignmentGrid(gesture.startPlacement.x + dx, gesture.startPlacement.y + dy);
    patchTarget(gesture.target, snapped);
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    pointersRef.current.delete(event.pointerId);
    try {
      if (overlayRef.current?.hasPointerCapture(event.pointerId)) {
        overlayRef.current.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* ignore */
    }
    if (!gesture) return;

    // Re-tap on a stack of overlapping elements -> cycle to the one beneath.
    if (
      gesture.mode === "move" &&
      !gesture.moved &&
      gesture.alreadySelected &&
      gesture.hits.length > 1
    ) {
      const idx = gesture.hits.findIndex((h) => elementKey(h) === elementKey(gesture.target));
      const next = gesture.hits[(idx + 1) % gesture.hits.length];
      onSelect(next);
    } else if (gesture.mode === "move") {
      const placement = placementOf(gesture.target);
      if (placement) {
        const snapped = snapToAlignmentGrid(placement.x, placement.y);
        if (snapped.x !== placement.x || snapped.y !== placement.y) patchTarget(gesture.target, snapped);
      }
    } else if (gesture.mode === "rotate" || gesture.mode === "pinch") {
      const placement = placementOf(gesture.target);
      if (placement) {
        const snappedRot = snapRotation(placement.rotation);
        if (snappedRot !== placement.rotation) patchTarget(gesture.target, { rotation: snappedRot });
      }
    }

    if (pointersRef.current.size === 0) {
      gestureRef.current = null;
      finishEdit();
    } else {
      // A finger lifted mid-pinch — stop transforming until a fresh press.
      gestureRef.current = null;
    }
  };

  // ---- Selection overlay geometry ----
  const selectedBox = selected && side ? currentBounds()[elementKey(selected)] : null;

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {isEditable && (
        <div
          ref={overlayRef}
          className="absolute inset-0 h-full w-full touch-none select-none"
          style={{ cursor: gestureRef.current?.mode === "move" ? "grabbing" : "default" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          {selectedBox && cssScale > 0 && (
            <div
              className="qr-selection-box"
              style={{
                position: "absolute",
                left: (selectedBox.x + selectedBox.w / 2) * cssScale,
                top: (selectedBox.y + selectedBox.h / 2) * cssScale,
                width: selectedBox.w * cssScale,
                height: selectedBox.h * cssScale,
                transform: `translate(-50%, -50%) rotate(${selectedBox.rotation}deg)`,
              }}
            >
              <div className="qr-selection-outline" />
              {RESIZE_HANDLES.map((h) => (
                <span
                  key={h}
                  data-handle={h}
                  className={`qr-handle ${CORNER_HANDLES.has(h) ? "qr-handle--corner" : "qr-handle--edge"}`}
                  style={{
                    left: `${HANDLE_ANCHOR[h].x * 100}%`,
                    top: `${HANDLE_ANCHOR[h].y * 100}%`,
                  }}
                />
              ))}
              <span data-handle="rotate" className="qr-handle-rotate" aria-hidden>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 21v-4.5H8.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
