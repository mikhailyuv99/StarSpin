import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  classifyVideoAspect,
  type MenuVideoAspect,
} from "@/lib/menu";

export type VideoValidation =
  | { ok: true; aspect: MenuVideoAspect; duration: number }
  | { ok: false; error: string };

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mpeg|mpg)$/i;
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/mpeg",
]);

/** True for video MIME or common video extensions (Windows often leaves type empty). */
export function isMenuVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return VIDEO_EXT.test(file.name);
}

export function validateMenuVideoFile(file: File): Promise<VideoValidation> {
  const typeOk =
    !file.type ||
    ALLOWED_VIDEO_TYPES.has(file.type) ||
    file.type.startsWith("video/") ||
    VIDEO_EXT.test(file.name);
  if (!typeOk) {
    return Promise.resolve({ ok: false, error: "videoType" });
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return Promise.resolve({ ok: false, error: "videoSize" });
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    let settled = false;
    let timer = 0;
    const finish = (result: VideoValidation) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(result);
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const aspect = classifyVideoAspect(video.videoWidth, video.videoHeight);
      if (!Number.isFinite(duration) || duration <= 0) {
        finish({ ok: false, error: "videoMeta" });
        return;
      }
      if (duration > MAX_VIDEO_SECONDS + 0.25) {
        finish({ ok: false, error: "videoDuration" });
        return;
      }
      if (!aspect) {
        finish({ ok: false, error: "videoAspect" });
        return;
      }
      finish({ ok: true, aspect, duration });
    };
    video.onerror = () => finish({ ok: false, error: "videoMeta" });
    // Some browsers never fire metadata for certain containers — fail soft after a wait.
    timer = window.setTimeout(() => finish({ ok: false, error: "videoMeta" }), 8000);
    video.src = url;
  });
}

/** Rasterize PDF pages to PNG blobs via pdf.js (dynamic import). */
export async function rasterizePdfPages(file: File, maxPages = 20): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  // Use CDN worker matching package major when available
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages = Math.min(doc.numPages, maxPages);
  const blobs: Blob[] = [];

  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (blob) blobs.push(blob);
  }

  return blobs;
}
