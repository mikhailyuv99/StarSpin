"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PricingMarket } from "@/lib/pricing-market";

const PricingMarketContext = createContext<PricingMarket>("vn");

export function PricingMarketProvider({
  market,
  children,
}: {
  market: PricingMarket;
  children: ReactNode;
}) {
  return <PricingMarketContext.Provider value={market}>{children}</PricingMarketContext.Provider>;
}

export function usePricingMarket(): PricingMarket {
  return useContext(PricingMarketContext);
}
