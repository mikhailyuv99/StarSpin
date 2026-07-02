import type { LegalSection } from "@/components/legal/LegalDocument";

export const privacySections: LegalSection[] = [
  {
    heading: "1. Who we are",
    body: "STARSPIN (starspin.cc) provides loyalty and review-growth software for local businesses. Contact: hello@starspin.cc.",
  },
  {
    heading: "2. Data we process",
    body: "Merchant accounts: email, auth identifiers, business profile, billing IDs (via Stripe).\n\nEnd-customer data (on behalf of Merchants): device fingerprint for anti-abuse, optional email and phone at prize claim, review screenshot uploads, prize codes, journey step completion metadata.",
  },
  {
    heading: "3. Purposes & legal bases",
    body: "We process data to provide the service (contract), secure the platform (legitimate interest), send prize emails requested by the customer (contract/legitimate interest), and comply with law. Merchants must have a lawful basis to collect customer contact data.",
  },
  {
    heading: "4. Processors",
    body: "We use subprocessors including Supabase (database/auth/storage), Stripe (payments), Resend (email), Twilio (optional SMS), Google (Places API for review counts when configured), and hosting (Netlify). Data may be processed in the EU/US depending on provider.",
  },
  {
    heading: "5. Retention",
    body: "Account data is kept while the subscription is active and as required for billing/legal obligations. Spin and CRM records are retained for the Merchant account lifecycle unless deleted by us on termination after a reasonable period.",
  },
  {
    heading: "6. Security",
    body: "We use industry-standard measures (encryption in transit, access controls, private storage for review screenshots with signed access). No system is 100% secure.",
  },
  {
    heading: "7. Rights",
    body: "Depending on applicable law (including GDPR), individuals may request access, correction, deletion, or restriction. Merchants should forward customer requests to hello@starspin.cc. Merchants can export CRM contacts from the dashboard.",
  },
  {
    heading: "8. Cookies",
    body: "We use essential cookies for authentication and locale. Marketing pages may use minimal functional storage. See our cookie notice on the homepage.",
  },
  {
    heading: "9. Changes",
    body: "We may update this policy. Material changes will be posted on this page with an updated date.",
  },
];
