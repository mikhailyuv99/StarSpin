import { SetupForm } from "./SetupForm";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ui } from "@/components/ui/styles";

export default async function SetupPage() {
  const merchant = await getCurrentMerchant();
  if (merchant) redirect("/dashboard");

  return (
    <div className={ui.page}>
      <header className="border-b border-border px-5 py-4 sm:px-8">
        <Link href="/" className="text-sm font-semibold text-ink">
          ← Roue Fidélité
        </Link>
      </header>
      <div className={ui.shellNarrow}>
        <h1 className={ui.h1}>Configurer votre commerce</h1>
        <p className={`mt-2 ${ui.muted}`}>
          Créez votre page publique et votre roue de fidélisation.
        </p>
        <div className="mt-8">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
