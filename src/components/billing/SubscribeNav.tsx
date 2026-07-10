import Link from "next/link";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";

export function SubscribeNav({
  backHref,
  backLabel,
  backLabelShort,
}: {
  backHref: string;
  backLabel: string;
  backLabelShort: string;
}) {
  return (
    <div className="cadeo-nav-wrap cadeo-nav-wrap--subscribe">
      <nav className="cadeo-nav cadeo-nav--subscribe-flow">
        <div className="cadeo-subscribe-nav-brand">
          <StarspinLogo href="/dashboard" variant="light" size="sm" />
        </div>
        <div className="cadeo-nav-actions cadeo-subscribe-nav-actions">
          <Link href={backHref} className="cadeo-btn cadeo-btn-outline cadeo-subscribe-back">
            <span className="cadeo-subscribe-back-short">{backLabelShort}</span>
            <span className="cadeo-subscribe-back-full">{backLabel}</span>
          </Link>
          <div className="cadeo-nav-locale cadeo-subscribe-nav-locale">
            <LocaleSwitcher variant="brutal" />
          </div>
        </div>
      </nav>
    </div>
  );
}
