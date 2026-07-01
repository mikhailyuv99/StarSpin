import { SetupForm } from "./SetupForm";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  const merchant = await getCurrentMerchant();
  if (merchant) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="mb-2 text-2xl font-bold">Configurer votre commerce</h1>
        <p className="mb-8 text-gray-600">
          Créez votre page publique et commencez à fidéliser vos clients.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}
