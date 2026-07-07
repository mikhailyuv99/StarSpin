"use client";

import { BUSINESS_LOGO_ID } from "@/lib/qr-design";
import { useTranslations } from "@/i18n/client";

export type GalleryImage = {
  id: string;
  url: string;
  aspectRatio: number;
  isBusinessLogo?: boolean;
  canDelete?: boolean;
};

export function qrImageDragPayload(libraryId: string, url: string, aspectRatio: number): string {
  return JSON.stringify({ libraryId, url, aspectRatio });
}

export function parseQrImageDragPayload(
  raw: string,
): { libraryId: string; url: string; aspectRatio: number } | null {
  try {
    const data = JSON.parse(raw) as { libraryId?: string; url?: string; aspectRatio?: number };
    if (typeof data.libraryId === "string" && typeof data.url === "string") {
      return {
        libraryId: data.libraryId,
        url: data.url,
        aspectRatio:
          typeof data.aspectRatio === "number" && data.aspectRatio > 0 ? data.aspectRatio : 1,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const QR_IMAGE_DRAG_TYPE = "application/x-qr-image";

export function QRDesignImageGallery({
  images,
  onImageClick,
  onDelete,
  selectedLibraryId,
}: {
  images: GalleryImage[];
  onImageClick: (libraryId: string, url: string, aspectRatio: number) => void;
  onDelete?: (libraryId: string) => void;
  selectedLibraryId?: string | null;
}) {
  const t = useTranslations();

  if (!images.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {t("dashboard.qrImageGalleryTitle")}
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((img) => {
          const selected = selectedLibraryId === img.id;
          return (
            <div key={img.id} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <img
                  src={img.url}
                  alt=""
                  draggable
                  onClick={() => onImageClick(img.id, img.url, img.aspectRatio)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      QR_IMAGE_DRAG_TYPE,
                      qrImageDragPayload(img.id, img.url, img.aspectRatio),
                    );
                  }}
                  className={`max-h-16 max-w-16 cursor-grab object-contain active:cursor-grabbing ${
                    selected ? "outline outline-2 outline-[var(--c-purple)] outline-offset-1" : ""
                  }`}
                />
                {img.canDelete && onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(img.id)}
                    aria-label={t("dashboard.qrImageDelete")}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-white text-[10px] font-bold leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="max-w-[4.5rem] truncate text-center text-[10px] font-semibold text-muted">
                {img.isBusinessLogo || img.id === BUSINESS_LOGO_ID
                  ? t("dashboard.qrBusinessLogo")
                  : t("dashboard.qrUploadedImage")}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs font-medium text-muted">{t("dashboard.qrImageDropzoneHint")}</p>
    </div>
  );
}
