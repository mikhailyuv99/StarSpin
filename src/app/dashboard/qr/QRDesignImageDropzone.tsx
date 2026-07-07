"use client";

import { useRef, useState } from "react";
import { useTranslations } from "@/i18n/client";

export function QRDesignImageDropzone({
  imageUrl,
  onUpload,
  onAddToDesign,
  onImageClick,
}: {
  imageUrl: string | null;
  onUpload: (file: File) => void | Promise<void>;
  onAddToDesign?: () => void;
  onImageClick?: () => void;
}) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    void onUpload(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length) {
      handleFile(event.dataTransfer.files[0]);
      return;
    }
    if (event.dataTransfer.types.includes("application/x-qr-logo") && onAddToDesign) {
      onAddToDesign();
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-extrabold text-ink">{t("dashboard.qrImageTitle")}</p>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pickFile();
        }}
        onClick={() => {
          if (!imageUrl) pickFile();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed px-4 py-5 transition-colors ${
          dragOver
            ? "border-[var(--c-purple)] bg-[var(--c-purple)]/10"
            : "border-black/25 bg-[var(--c-cream)]/40 hover:border-black/45"
        }`}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt=""
              draggable
              onClick={(e) => {
                e.stopPropagation();
                onImageClick?.();
              }}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData("application/x-qr-logo", "1");
              }}
              className="h-20 w-20 shrink-0 cursor-grab rounded-[12px] border-2 border-black object-cover shadow-[2px_2px_0_0_#0a0a0a] active:cursor-grabbing"
            />
            <p className="max-w-xs text-center text-xs font-medium text-muted">
              {t("dashboard.qrImageDropzoneHint")}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                pickFile();
              }}
              className="text-xs font-bold text-ink underline underline-offset-2"
            >
              {t("dashboard.qrImageReplace")}
            </button>
          </>
        ) : (
          <>
            <span className="text-2xl font-light text-muted" aria-hidden>
              +
            </span>
            <p className="max-w-xs text-center text-sm font-semibold text-ink">
              {t("dashboard.qrImageUploadHint")}
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
