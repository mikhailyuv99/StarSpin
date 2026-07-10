"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type ActiveMerchantContextValue = {
  activeMerchantId: string;
  switchMerchant: (merchantId: string) => Promise<boolean>;
};

const ActiveMerchantContext = createContext<ActiveMerchantContextValue | null>(null);

export function ActiveMerchantProvider({
  initialMerchantId,
  children,
}: {
  initialMerchantId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [activeMerchantId, setActiveMerchantId] = useState(initialMerchantId);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setActiveMerchantId(initialMerchantId);
  }, [initialMerchantId]);

  const switchMerchant = async (merchantId: string) => {
    if (merchantId === activeMerchantId) return true;

    const previous = activeMerchantId;
    setActiveMerchantId(merchantId);

    const res = await fetch("/api/merchants/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId }),
    });

    if (!res.ok) {
      setActiveMerchantId(previous);
      return false;
    }

    startTransition(() => {
      router.refresh();
    });
    return true;
  };

  return (
    <ActiveMerchantContext.Provider value={{ activeMerchantId, switchMerchant }}>
      {children}
    </ActiveMerchantContext.Provider>
  );
}

export function useActiveMerchant() {
  const ctx = useContext(ActiveMerchantContext);
  if (!ctx) {
    throw new Error("useActiveMerchant must be used within ActiveMerchantProvider");
  }
  return ctx;
}
