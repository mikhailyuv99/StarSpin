import { requireMerchant } from "@/lib/merchant";
import { QRDownload } from "./QRDownload";

export default async function QRPage() {
  const merchant = await requireMerchant();

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">QR Code</h2>
      <p className="mb-6 text-gray-600">
        Imprimez ce QR code et placez-le sur vos tables ou au comptoir.
      </p>
      <QRDownload slug={merchant.slug} />
    </div>
  );
}
