"use client";

import type { Merchant } from "@/lib/types";

export function MerchantHeader({ merchant }: { merchant: Merchant }) {
  return (
    <header className="mb-8 text-center">
      {merchant.logo_url && (
        <img
          src={merchant.logo_url}
          alt={merchant.name}
          className="mx-auto mb-4 h-16 w-16 rounded-sm border-2 border-white/30 object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {merchant.name}
      </h1>
      <p className="mt-2 text-sm text-white/75">
        Suivez les étapes pour participer
      </p>
    </header>
  );
}
