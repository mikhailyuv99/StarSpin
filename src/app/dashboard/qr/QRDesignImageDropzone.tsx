"use client";

import { useRef, useState } from "react";
import { useTranslations } from "@/i18n/client";

export function QRDesignImageDropzone({
  onUpload,
}: {
  onUpload: (file: File) => void | Promise<void>;
}) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) void onUpload(file);
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
        onClick={pickFile}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[6rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed px-4 py-4 transition-colors ${
          dragOver
            ? "border-[var(--c-purple)] bg-[var(--c-purple)]/10"
            : "border-black/25 bg-[var(--c-cream)]/40 hover:border-black/45"
        }`}
      >
        <span className="text-2xl font-light text-muted" aria-hidden>
          +
        </span>
        <p className="max-w-xs text-center text-sm font-semibold text-ink">
          {t("dashboard.qrImageUploadHint")}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
