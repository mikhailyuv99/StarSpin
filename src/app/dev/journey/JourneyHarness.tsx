"use client";

import { useMemo, useState } from "react";
import { JourneyThemePicker } from "@/components/dashboard/JourneyThemePicker";
import type { Merchant, Prize } from "@/lib/types";
import type { JourneyTemplateId } from "@/lib/journey-theme";

const PRIZES: Prize[] = [
 { id: "p1", merchant_id: "dev", label: "Free coffee", icon: "coffee_cup", probability_weight: 30, stock_remaining: null, active: true, created_at: "" },
 { id: "p2", merchant_id: "dev", label: "-10%", icon: "percent_10", probability_weight: 30, stock_remaining: null, active: true, created_at: "" },
 { id: "p3", merchant_id: "dev", label: "Dessert", icon: "cupcake", probability_weight: 20, stock_remaining: null, active: true, created_at: "" },
 { id: "p4", merchant_id: "dev", label: "-20%", icon: "percent_20", probability_weight: 10, stock_remaining: null, active: true, created_at: "" },
 { id: "p5", merchant_id: "dev", label: "Free menu", icon: "salad", probability_weight: 5, stock_remaining: null, active: true, created_at: "" },
 { id: "p6", merchant_id: "dev", label: "Try again", icon: "try_again", probability_weight: 5, stock_remaining: null, active: true, created_at: "" },
];

const LOGO =
 "data:image/svg+xml;charset=utf-8," +
 encodeURIComponent(
 "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='96' height='96' rx='20' fill='#111'/><text x='50%' y='58%' font-size='46' text-anchor='middle' fill='#fff' font-family='sans-serif' font-weight='800'>B</text></svg>",
 );

export function JourneyHarness() {
 const [template, setTemplate] = useState<JourneyTemplateId>("pop");
 const [accent, setAccent] = useState("");

 const merchant = useMemo<Merchant>(
 () => ({
 id: "dev-merchant",
 slug: "dev-preview",
 owner_id: "dev",
 account_id: "dev-account",
 name: "Bella Pizza",
 logo_url: LOGO,
 primary_color: "#9b7fe8",
 secondary_color: "#f5e08e",
 google_review_link: "https://maps.google.com",
 google_place_id: null,
 social_links: {
 instagram: "https://instagram.com",
 facebook: "https://facebook.com",
 },
 subscription_status: "active",
 flow_steps: ["instagram", "facebook"],
 customer_page_headline: "Bella Pizza",
 customer_page_subtitle: "Spin the wheel & win a treat!",
 spin_button_label: "SPIN TO WIN",
 journey_theme: { v: 1, template, accent: accent || null },
 created_at: "2026-01-01T00:00:00.000Z",
 }),
 [template, accent],
 );

 return (
 <div>
 <div
 style={{
 position: "sticky",
 top: 0,
 zIndex: 50,
 padding: "10px 14px",
 background: "#111",
 color: "#fff",
 fontFamily: "system-ui, sans-serif",
 }}
 >
 <strong style={{ fontSize: 13, letterSpacing: "0.05em" }}>JOURNEY THEMES · {template}</strong>
 </div>

 <div className="mx-auto max-w-4xl p-4">
 <div className="rounded-2xl border-2 border-black bg-white p-4 ">
 <p className="mb-3 text-sm font-extrabold uppercase tracking-wide">Dashboard picker</p>
 <JourneyThemePicker
 template={template}
 accent={accent}
 onTemplateChange={setTemplate}
 onAccentChange={setAccent}
 previewMerchant={merchant}
 previewPrizes={PRIZES}
 />
 </div>
 </div>
 </div>
 );
}
