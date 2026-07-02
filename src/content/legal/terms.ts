import type { LegalSection } from "@/components/legal/LegalDocument";

export const termsSections: LegalSection[] = [
  {
    heading: "1. Service",
    body: "STARSPIN provides a subscription software service that lets Merchants run a branded customer journey (reviews, social steps, prize wheel, CRM export). The public wheel is available only while an active paid subscription (including Stripe trial) is in good standing.",
  },
  {
    heading: "2. Accounts",
    body: "You must provide accurate business information. You are responsible for activity under your account and for configuring your journey, prizes, and links lawfully.",
  },
  {
    heading: "3. Subscriptions & billing",
    body: "Paid plans are billed through Stripe. A 7-day trial may apply at checkout; after the trial, billing continues automatically unless cancelled. Prices are shown at checkout. You can manage or cancel from your dashboard Billing page.",
  },
  {
    heading: "4. Merchant responsibilities",
    body: "You are responsible for prizes you offer, honoring winning codes, obtaining consent to contact customers, and complying with local laws (consumer protection, marketing, games/promotions, data protection). Do not run unlawful lotteries or misleading promotions.",
  },
  {
    heading: "5. Customer data",
    body: "You control customer data collected through your wheel (emails, optional phone numbers, review screenshots). You act as data controller for that data; STARSPIN processes it on your instructions as described in our Privacy Policy.",
  },
  {
    heading: "6. Acceptable use",
    body: "No abuse, fraud, scraping, reverse engineering, or attempts to bypass subscription limits. We may suspend accounts that threaten platform stability or violate law.",
  },
  {
    heading: "7. Availability",
    body: "We aim for high availability but do not guarantee uninterrupted service. Maintenance, third-party outages (Stripe, Supabase, etc.), or force majeure may cause downtime.",
  },
  {
    heading: "8. Limitation of liability",
    body: "To the maximum extent permitted by law, STARSPIN is not liable for indirect damages, lost profits, or disputes between you and your customers. Our aggregate liability is limited to fees paid in the 12 months before the claim.",
  },
  {
    heading: "9. Termination",
    body: "You may cancel anytime. We may terminate for breach or non-payment. On termination, your public wheel is deactivated; you may export CRM data while your account remains accessible.",
  },
  {
    heading: "10. Governing law",
    body: "These Terms are governed by French law, without prejudice to mandatory consumer protections where applicable. Courts of Paris have jurisdiction, subject to mandatory rules.",
  },
];
