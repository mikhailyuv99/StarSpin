"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const HALF_VH = 52;
const EXPANDED_VH = 92;
const MIN_VH = 24;
const MAX_VH = 96;
const SNAP_PX = 70;
const CLOSE_MS = 280;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Docked bottom sheet: half (~52dvh) ↔ expanded (~92dvh), grabber-only Pointer Events drag.
 * Portaled to document.body so menu-studio overflow never clips it.
 */
export function DockSheet({
  open,
  onClose,
  bottomOffset = 0,
  children,
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  /** Pixels reserved under the sheet (e.g. tab bar height). */
  bottomOffset?: number;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [liveVh, setLiveVh] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(open);
  const [portalReady, setPortalReady] = useState(false);

  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    baseVh: number;
  } | null>(null);
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sheetVh = liveVh ?? (expanded ? EXPANDED_VH : HALF_VH);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Mount / open → always reset to half, animate in from below.
  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(true);
      setExiting(false);
      setExpanded(false);
      setLiveVh(null);
      setDragging(false);
      setEntered(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    if (mounted) {
      setExiting(true);
      setEntered(false);
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        setExiting(false);
        closeTimerRef.current = null;
      }, CLOSE_MS);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- mount machine keyed on open only

  if (!mounted || !portalReady) return null;

  const requestClose = () => {
    onClose();
  };

  const onGrabberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const baseVh = expandedRef.current ? EXPANDED_VH : HALF_VH;
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      baseVh,
    };
    setDragging(true);
    setLiveVh(baseVh);
  };

  const onGrabberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const deltaY = e.clientY - drag.startY;
    const live = clamp(
      drag.baseVh - (deltaY / window.innerHeight) * 100,
      MIN_VH,
      MAX_VH,
    );
    setLiveVh(live);
  };

  const onGrabberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const deltaY = e.clientY - drag.startY;
    dragRef.current = null;
    setDragging(false);
    setLiveVh(null);

    if (deltaY <= -SNAP_PX) {
      setExpanded(true);
      return;
    }
    if (deltaY >= SNAP_PX) {
      if (expandedRef.current) {
        setExpanded(false);
      } else {
        requestClose();
      }
      return;
    }
  };

  const visible = entered && !exiting;
  const maxHeight = `calc(100dvh - ${Math.max(0, bottomOffset)}px)`;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex items-end justify-center"
      style={{ bottom: bottomOffset }}
      aria-hidden={!open || exiting}
    >
      <div
        role="dialog"
        aria-label={ariaLabel}
        aria-modal={false}
        className="pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-black/10 border-b-0 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
        style={{
          height: `${sheetVh}dvh`,
          maxHeight,
          transition: dragging
            ? "none"
            : "height 260ms ease, transform 280ms ease",
          transform: visible ? "translateY(0)" : "translateY(105%)",
        }}
      >
        <div
          role="slider"
          aria-valuenow={Math.round(sheetVh)}
          aria-valuemin={MIN_VH}
          aria-valuemax={MAX_VH}
          aria-label={ariaLabel}
          className="flex h-11 w-full shrink-0 cursor-grab touch-none select-none items-center justify-center border-b border-black/5 bg-white active:cursor-grabbing"
          style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
          onPointerDown={onGrabberPointerDown}
          onPointerMove={onGrabberPointerMove}
          onPointerUp={onGrabberPointerUp}
          onPointerCancel={onGrabberPointerUp}
        >
          <span aria-hidden className="pointer-events-none h-1.5 w-12 rounded-full bg-zinc-400" />
        </div>
        <div className="menu-studio-sheet-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pt-3 pb-5 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
