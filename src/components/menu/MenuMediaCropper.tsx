"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  file: File;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

/** Pan / zoom / crop editor — exports a square-ish or free crop as JPEG. */
export function MenuMediaCropper({
  file,
  title,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      const frame = 320;
      const fit = Math.max(frame / image.width, frame / image.height);
      setScale(fit);
      setOffset({ x: 0, y: 0 });
    };
    image.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, size, size);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, size / 2 + offset.x - w / 2, size / 2 + offset.y - h / 2, w, h);
    // soft vignette edge
    const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.72);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }, [img, offset.x, offset.y, scale]);

  useEffect(() => {
    draw();
  }, [draw]);

  const exportCrop = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    if (!blob) return;
    const out = new File([blob], file.name.replace(/\.\w+$/, "") + "-crop.jpg", {
      type: "image/jpeg",
    });
    onConfirm(out);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-3 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-black/5 px-4 py-3">
          <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
        </div>
        <div className="space-y-3 p-4">
          <canvas
            ref={canvasRef}
            width={360}
            height={360}
            className="mx-auto block w-full max-w-[360px] touch-none rounded-2xl bg-zinc-900"
            onPointerDown={(e) => {
              const el = e.currentTarget;
              el.setPointerCapture(e.pointerId);
              dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              setOffset({
                x: dragRef.current.ox + (e.clientX - dragRef.current.x),
                y: dragRef.current.oy + (e.clientY - dragRef.current.y),
              });
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
          />
          <label className="block text-xs font-semibold text-zinc-700">
            Zoom
            <input
              type="range"
              min={0.2}
              max={4}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          {!url ? <p className="text-center text-sm text-zinc-500">…</p> : null}
        </div>
        <div className="flex gap-2 border-t border-black/5 p-3">
          <button
            type="button"
            className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm font-semibold"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-black px-3 py-2.5 text-sm font-semibold text-white"
            onClick={() => void exportCrop()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
