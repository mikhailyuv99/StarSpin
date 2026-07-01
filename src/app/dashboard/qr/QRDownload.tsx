"use client";

import { ui } from "@/components/ui/styles";

export function QRDownload({ slug }: { slug: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  const publicUrl = `${baseUrl}/r/${slug}`;
  const qrUrl = `/api/qr/${slug}`;

  return (
    <div className={`${ui.card} max-w-sm`}>
      <img src={qrUrl} alt={`QR ${slug}`} className="w-full border border-border" />
      <p className="mt-4 text-center font-mono text-xs text-muted">{publicUrl}</p>
      <a href={qrUrl} download={`qr-${slug}.png`} className={`mt-6 block w-full text-center ${ui.btn}`}>
        Télécharger PNG
      </a>
    </div>
  );
}
