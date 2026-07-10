import { notFound } from "next/navigation";
import { QRDesignStudio } from "@/app/dashboard/qr/QRDesignStudio";
import type { Merchant } from "@/lib/types";

// Local-only harness to develop/test the QR studio canvas without auth.
// Never available in production builds.
const SAMPLE_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='120'><rect width='240' height='120' rx='16' fill='#ffd23f'/><circle cx='60' cy='60' r='34' fill='#ff5c8a'/><rect x='120' y='30' width='90' height='60' rx='10' fill='#8b5cf6'/></svg>",
  );

const mockMerchant: Merchant = {
  id: "dev-merchant",
  slug: "dev-preview",
  owner_id: "dev",
  account_id: "dev-account",
  name: "Dev Studio",
  logo_url: null,
  primary_color: "#8b5cf6",
  secondary_color: "#ffd23f",
  google_review_link: null,
  google_place_id: null,
  social_links: {},
  subscription_status: "active",
  qr_fg_color: "#0a0a0a",
  qr_bg_color: "#ffffff",
  qr_design: {
    v: 3,
    template: "table_sticker",
    imageLibrary: [{ id: "lib-sample", url: SAMPLE_IMAGE, aspectRatio: 2 }],
    sticker: {
      layoutBg: "#ffffff",
      qr: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      textBoxes: [
        {
          id: "tb-sample",
          text: "Scan & win",
          fontId: "montserrat",
          color: "#0a0a0a",
          placement: { x: 0.5, y: 0.85, scale: 1, rotation: 0 },
        },
      ],
      images: [
        {
          id: "img-sample",
          libraryId: "lib-sample",
          url: SAMPLE_IMAGE,
          aspectRatio: 2,
          placement: { x: 0.5, y: 0.42, scale: 4, rotation: 0 },
        },
      ],
    },
    visitCard: {
      front: {
        layoutBg: "#ffffff",
        qr: { x: 0.28, y: 0.5, scale: 1, rotation: 0 },
        textBoxes: [],
        images: [],
      },
      back: {
        layoutBg: "#ffffff",
        qr: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
        textBoxes: [],
        images: [],
      },
    },
  },
  created_at: "2026-01-01T00:00:00.000Z",
};

export default function DevQrHarnessPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="qr-design-studio-page mx-auto max-w-6xl space-y-4 p-4">
      <h1 className="text-lg font-extrabold uppercase">QR Studio — dev harness</h1>
      <QRDesignStudio merchant={mockMerchant} />
    </div>
  );
}
