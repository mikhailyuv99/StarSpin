"use client";

export function QRDownload({ slug }: { slug: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  const publicUrl = `${baseUrl}/r/${slug}`;
  const qrUrl = `/api/qr/${slug}`;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <img src={qrUrl} alt={`QR ${slug}`} className="mx-auto h-64 w-64" />
      <p className="mt-4 text-center text-sm text-gray-600">{publicUrl}</p>
      <a
        href={qrUrl}
        download={`qr-${slug}.png`}
        className="mt-6 block w-full rounded-lg bg-orange-600 py-3 text-center font-semibold text-white"
      >
        Télécharger PNG
      </a>
    </div>
  );
}
