import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { termsSections } from "@/content/legal/terms";
import { CONTACT_EMAIL, OFFICIAL_SITE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service — STARSPIN",
  description: "STARSPIN terms of service for merchants.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated="July 1, 2026"
      intro={`These Terms govern your use of STARSPIN (${OFFICIAL_SITE_URL}) operated for business customers (“Merchants”). By creating an account or subscribing, you agree to these Terms.`}
      sections={termsSections}
      contactEmail={CONTACT_EMAIL}
    />
  );
}
