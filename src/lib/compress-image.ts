/** Default dish / banner compress — smaller for fast mobile uploads. */
export const MENU_IMAGE_COMPRESS = {
  maxEdge: 1600,
  quality: 0.72,
  maxBytes: 1.5 * 1024 * 1024,
} as const;

/** Page wallpaper — keep more resolution and detail. */
export const MENU_BG_IMAGE_COMPRESS = {
  maxEdge: 2560,
  quality: 0.92,
  maxBytes: 5 * 1024 * 1024,
} as const;

const KEEP_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

/** Downscale / re-encode a photo for reliable mobile uploads. Falls back to the original file. */
export async function compressImageForUpload(
  file: File,
  opts: { maxEdge?: number; quality?: number; maxBytes?: number } = {},
): Promise<File> {
  const maxEdge = opts.maxEdge ?? MENU_IMAGE_COMPRESS.maxEdge;
  const quality = opts.quality ?? MENU_IMAGE_COMPRESS.quality;
  const maxBytes = opts.maxBytes ?? MENU_IMAGE_COMPRESS.maxBytes;

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const needsDownscale = longest > maxEdge;
    const underBudget = file.size <= maxBytes;

    // Keep original when already small enough and a browser-friendly type.
    if (!needsDownscale && underBudget && KEEP_TYPES.has(file.type)) {
      bitmap.close();
      return file;
    }

    const scale = Math.min(1, maxEdge / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
    if (!blob || blob.size <= 0) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
