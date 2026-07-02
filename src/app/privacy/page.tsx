import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacySections } from "@/content/legal/privacy";
import { CONTACT_EMAIL, OFFICIAL_SITE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy — STARSPIN",
  description: "How STARSPIN collects and processes personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="July 1, 2026"
      intro={`This Privacy Policy explains how STARSPIN (${OFFICIAL_SITE_URL}) processes personal data when Merchants use our service and when end-customers interact with a Merchant's prize wheel.`}
      sections={privacySections}
      contactEmail={CONTACT_EMAIL}
    />
  );
}
