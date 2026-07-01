import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Accueil" },
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-gray-500">Dashboard</p>
            <h1 className="font-bold">{merchant.name}</h1>
          </div>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
