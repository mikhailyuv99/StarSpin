import { requireMerchant } from "@/lib/merchant";
import { QRDownload } from "./QRDownload";
import { ui } from "@/components/ui/styles";

export default async function QRPage() {
  const merchant = await requireMerchant();

  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>QR Code</h1>
        <p className={ui.muted}>Imprimez et placez sur vos tables ou au comptoir.</p>
      </div>
      <QRDownload slug={merchant.slug} />
    </div>
  );
}
