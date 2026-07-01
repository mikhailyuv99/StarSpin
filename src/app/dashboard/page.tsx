import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Bienvenue, {merchant.name}</h2>
        <p className="mt-2 text-gray-600">
          Votre page publique :{" "}
          <Link href={`/r/${merchant.slug}`} className="text-orange-600 underline">
            /r/{merchant.slug}
          </Link>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Statut abonnement : <span className="font-medium">{merchant.subscription_status}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/branding" className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md">
          <h3 className="font-semibold">Branding</h3>
          <p className="text-sm text-gray-600">Logo, couleurs, liens sociaux</p>
        </Link>
        <Link href="/dashboard/prizes" className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md">
          <h3 className="font-semibold">Prix</h3>
          <p className="text-sm text-gray-600">Gérer la roue et les stocks</p>
        </Link>
        <Link href="/dashboard/qr" className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md">
          <h3 className="font-semibold">QR Code</h3>
          <p className="text-sm text-gray-600">Télécharger pour vos tables</p>
        </Link>
        <Link href="/dashboard/stats" className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md">
          <h3 className="font-semibold">Statistiques</h3>
          <p className="text-sm text-gray-600">Spins, follows, avis Google</p>
        </Link>
      </div>
    </div>
  );
}
