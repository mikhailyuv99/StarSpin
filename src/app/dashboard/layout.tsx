import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Accueil", exact: true },
  { href: "/dashboard/branding", label: "Branding" },
  { href: "/dashboard/prizes", label: "Prix" },
  { href: "/dashboard/reviews", label: "Avis" },
  { href: "/dashboard/stats", label: "Stats" },
  { href: "/dashboard/qr", label: "QR Code" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-[10px] font-bold text-white">
              RF
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Dashboard</p>
              <p className="text-sm font-semibold leading-none text-ink">{merchant.name}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-5xl gap-0 overflow-x-auto border-t border-border px-5 sm:px-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-[13px] font-medium text-muted transition-colors hover:border-zinc-300 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
