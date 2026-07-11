import Link from "next/link";
import { CopyPublicLinkButton } from "@/components/dashboard/CopyPublicLinkButton";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { publicMerchantPath } from "@/lib/app-url";
import { OFFICIAL_SITE_HOST } from "@/lib/brand";

type QuickLink = { href: string; title: string };

export function DashboardHomeActive({
  slug,
  publicUrl,
  totalSpins,
  showBilling,
  quickLinks,
  labels,
}: {
  slug: string;
  publicUrl: string;
  totalSpins: number;
  showBilling: boolean;
  quickLinks: QuickLink[];
  labels: {
    title: string;
    body: string;
    testJourney: string;
    copyLink: string;
    copiedLink: string;
    totalSpins: string;
    quickNav: string;
  };
}) {
  return (
    <div className="dashboard-home-active">
      <div className="dashboard-home-live">
        <h2 className="text-base font-extrabold text-ink">{labels.title}</h2>
        <p className="mt-1 text-sm text-muted">{labels.body}</p>

        <div className="dashboard-home-url-row">
          <p className="dashboard-home-url font-mono text-sm font-bold text-ink">
            {OFFICIAL_SITE_HOST}
            {publicMerchantPath(slug)}
          </p>
          <CopyPublicLinkButton
            url={publicUrl}
            copyLabel={labels.copyLink}
            copiedLabel={labels.copiedLink}
          />
        </div>

        <div className="dashboard-home-cta-row">
          <a
            href={publicMerchantPath(slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn brutal-btn-yellow text-sm !w-auto px-5 py-2.5"
          >
            {labels.testJourney}
          </a>
          {showBilling && (
            <ManageBillingButton className="brutal-btn brutal-btn-white text-sm !w-auto px-4 py-2.5" />
          )}
        </div>

        <p className="text-sm font-medium text-muted">
          <span className="font-extrabold text-ink">{totalSpins}</span> {labels.totalSpins}
        </p>
      </div>

      <nav className="dashboard-home-actions" aria-label={labels.quickNav}>
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`dashboard-home-action${
              link.href === "/dashboard/crm" ? " dashboard-home-action--wide" : ""
            }`}
          >
            {link.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
