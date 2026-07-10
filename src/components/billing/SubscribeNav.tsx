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
            <span className="cadeo-subscribe-back-icon" aria-hidden>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                <path
                  d="M10 3 5 8l5 5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="cadeo-subscribe-back-text">
              <span className="cadeo-subscribe-back-short">{backLabelShort}</span>
              <span className="cadeo-subscribe-back-full">{backLabel}</span>
            </span>
          </Link>
          <div className="cadeo-subscribe-nav-tools">
            <div className="cadeo-nav-locale cadeo-subscribe-nav-locale">
              <LocaleSwitcher variant="brutal" compact />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
