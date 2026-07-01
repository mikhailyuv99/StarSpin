import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { publicMerchantUrl } from "@/lib/app-url";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = publicMerchantUrl(slug);

  const png = await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${slug}.png"`,
    },
  });
}
