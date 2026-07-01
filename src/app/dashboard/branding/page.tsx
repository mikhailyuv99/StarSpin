import { requireMerchant } from "@/lib/merchant";
import { BrandingForm } from "./BrandingForm";

export default async function BrandingPage() {
  const merchant = await requireMerchant();
  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Branding & liens</h2>
      <BrandingForm merchant={merchant} />
    </div>
  );
}
