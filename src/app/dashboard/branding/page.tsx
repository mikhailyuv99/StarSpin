import { requireMerchant } from "@/lib/merchant";
import { BrandingForm } from "./BrandingForm";
import { ui } from "@/components/ui/styles";

export default async function BrandingPage() {
  const merchant = await requireMerchant();
  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>Branding & liens</h1>
        <p className={ui.muted}>Identité visuelle et liens affichés sur votre page publique.</p>
      </div>
      <BrandingForm merchant={merchant} />
    </div>
  );
}
