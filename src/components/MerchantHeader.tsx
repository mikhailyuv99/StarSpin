"use client";

import type { Merchant } from "@/lib/types";

interface MerchantHeaderProps {
  merchant: Merchant;
}

export function MerchantHeader({ merchant }: MerchantHeaderProps) {
  return (
    <header className="mb-8 text-center">
      {merchant.logo_url && (
        <img
          src={merchant.logo_url}
          alt={merchant.name}
          className="mx-auto mb-4 h-20 w-20 rounded-full object-cover shadow-md"
        />
      )}
      <h1 className="text-2xl font-bold text-white sm:text-3xl">{merchant.name}</h1>
      <p className="mt-2 text-white/80">Scannez, suivez, avis — gagnez un prix !</p>
    </header>
  );
}
