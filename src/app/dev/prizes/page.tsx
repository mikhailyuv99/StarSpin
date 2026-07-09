import { notFound } from "next/navigation";
import { PrizesManager } from "@/app/dashboard/prizes/PrizesManager";
import type { Prize } from "@/lib/types";
import { ui } from "@/components/ui/styles";

const MOCK_PRIZES: Prize[] = [
  {
    id: "dev-p1",
    merchant_id: "dev",
    label: "Free coffee",
    icon: "coffee_cup",
    probability_weight: 30,
    stock_remaining: null,
    active: true,
    created_at: new Date(0).toISOString(),
    redeem_next_visit: false,
    redeem_min_spend_cents: null,
    redeem_valid_days: null,
  },
  {
    id: "dev-p2",
    merchant_id: "dev",
    label: "10% off",
    icon: "percent_10",
    probability_weight: 25,
    stock_remaining: 50,
    active: true,
    created_at: new Date(0).toISOString(),
    redeem_next_visit: true,
    redeem_min_spend_cents: null,
    redeem_valid_days: 7,
  },
  {
    id: "dev-p3",
    merchant_id: "dev",
    label: "Free dessert",
    icon: "cupcake",
    probability_weight: 20,
    stock_remaining: null,
    active: true,
    created_at: new Date(0).toISOString(),
    redeem_next_visit: false,
    redeem_min_spend_cents: null,
    redeem_valid_days: null,
  },
];

/** Local preview of prizes UI — no login required. */
export const dynamic = "force-dynamic";

export default function DevPrizesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className={`${ui.shell} space-y-4`}>
      <div className="rounded-[14px] border-2 border-dashed border-black bg-[var(--c-cream)] px-4 py-3 text-sm font-medium text-muted">
        Dev preview — icon picker & wheel layout. Saves won&apos;t persist without dashboard login.
      </div>
      <PrizesManager
        merchantId="dev"
        initialPrizes={MOCK_PRIZES}
        primaryColor="#ff9dc4"
        secondaryColor="#d8ccf5"
        journeyTheme={null}
        socialLinks={{
          instagram: "https://instagram.com/example",
          facebook: "https://facebook.com/example",
          tiktok: "https://tiktok.com/@example",
        }}
      />
    </div>
  );
}
