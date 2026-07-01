import Link from "next/link";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";
import { ui } from "@/components/ui/styles";

export default async function DashboardPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");

  const links = [
    { href: "/dashboard/branding", title: "Branding", desc: "Logo, couleurs, liens sociaux" },
    { href: "/dashboard/prizes", title: "Prix", desc: "Roue, probabilités et stocks" },
    { href: "/dashboard/qr", title: "QR Code", desc: "Télécharger pour vos tables" },
    { href: "/dashboard/stats", title: "Statistiques", desc: "Spins, follows, avis" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>Accueil</h1>
        <p className={ui.muted}>Vue d&apos;ensemble de votre programme.</p>
      </div>

      <div className={ui.card}>
        <p className={ui.statLabel}>Page publique</p>
        <Link href={`/${merchant.slug}`} className={`mt-2 inline-block font-mono text-sm ${ui.link}`}>
          /{merchant.slug}
        </Link>
        <p className="mt-4 text-sm text-muted">
          Abonnement ·{" "}
          <span className="font-mono text-xs uppercase text-ink">{merchant.subscription_status}</span>
        </p>
      </div>

      <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="bg-white p-6 hover:bg-surface">
            <h2 className="text-[15px] font-semibold text-ink">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
