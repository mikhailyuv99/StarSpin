import Link from "next/link";
import { CopyPublicLinkButton } from "@/components/dashboard/CopyPublicLinkButton";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { ui } from "@/components/ui/styles";
import { publicMerchantPath } from "@/lib/app-url";
import { OFFICIAL_SITE_HOST } from "@/lib/brand";

export function MerchantLiveCard({
  slug,
  publicUrl,
  totalSpins,
  labels,
  showBilling,
}: {
  slug: string;
  publicUrl: string;
  totalSpins: number;
  labels: {
    title: string;
    body: string;
    testJourney: string;
    copyLink: string;
    copiedLink: string;
    totalSpins: string;
    viewCrm: string;
  };
  showBilling: boolean;
}) {
  return (
    <div className={`${ui.card} border-[var(--c-mint)] bg-[var(--c-mint)]/25`}>
      <h2 className="text-base font-extrabold text-ink">{labels.title}</h2>
      <p className="mt-2 text-sm text-muted">{labels.body}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="font-mono text-sm font-bold text-ink">
          {OFFICIAL_SITE_HOST}
          {publicMerchantPath(slug)}
        </p>
        <CopyPublicLinkButton
          url={publicUrl}
          copyLabel={labels.copyLink}
          copiedLabel={labels.copiedLink}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={publicMerchantPath(slug)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ui.btnYellow} !w-auto px-6 py-3 inline-flex`}
        >
          {labels.testJourney}
        </a>
        {showBilling && <ManageBillingButton className={`${ui.btnOutline} !w-auto px-5`} />}
      </div>

      <p className="mt-4 text-sm font-medium text-muted">
        <span className="font-extrabold text-ink">{totalSpins}</span> {labels.totalSpins}
        {" · "}
        <Link href="/dashboard/crm" className={ui.link}>
          {labels.viewCrm}
        </Link>
      </p>
    </div>
  );
}
