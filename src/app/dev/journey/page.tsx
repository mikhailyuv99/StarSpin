import { notFound } from "next/navigation";
import { JourneyHarness } from "./JourneyHarness";
import { allJourneyFontHrefs } from "@/lib/journey-theme";

// Local-only harness to develop/preview the customer-journey themes without
// Supabase or an active subscription. Never available in production builds.
export const dynamic = "force-dynamic";

export default function DevJourneyHarnessPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      {allJourneyFontHrefs().map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <JourneyHarness />
    </>
  );
}
