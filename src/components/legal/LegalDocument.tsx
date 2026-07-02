import Link from "next/link";
import { StarspinLogo } from "@/components/StarspinLogo";

export type LegalSection = { heading: string; body: string };

export function LegalDocument({
  title,
  updated,
  intro,
  sections,
  contactEmail,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  contactEmail: string;
}) {
  return (
    <div className="brutal-page min-h-screen pb-16">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <StarspinLogo href="/" variant="light" size="md" />
          <Link href="/" className="text-sm font-bold text-ink underline underline-offset-4">
            Home
          </Link>
        </div>
        <article className="brutal-card space-y-8 p-6 sm:p-8">
          <header className="space-y-2">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase text-ink">
              {title}
            </h1>
            <p className="text-sm font-medium text-muted">Last updated: {updated}</p>
            <p className="text-sm leading-relaxed text-ink">{intro}</p>
          </header>
          {sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-base font-extrabold text-ink">{section.heading}</h2>
              <p className="text-sm leading-relaxed text-muted whitespace-pre-line">{section.body}</p>
            </section>
          ))}
          <footer className="border-t-2 border-black/10 pt-6 text-sm text-muted">
            Questions:{" "}
            <a href={`mailto:${contactEmail}`} className="font-bold text-ink underline">
              {contactEmail}
            </a>
          </footer>
        </article>
      </div>
    </div>
  );
}
