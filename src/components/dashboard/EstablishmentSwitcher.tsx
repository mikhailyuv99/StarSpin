"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/i18n/client";
import { useActiveMerchant } from "@/components/dashboard/ActiveMerchantContext";

type EstablishmentOption = { id: string; name: string };

export function EstablishmentSwitcher({
  establishments,
}: {
  establishments: EstablishmentOption[];
}) {
  const t = useTranslations();
  const { activeMerchantId, switchMerchant } = useActiveMerchant();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeEstablishment =
    establishments.find((e) => e.id === activeMerchantId) ?? establishments[0];

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (establishments.length <= 1) {
    const only = establishments[0];
    if (!only) return null;

    return (
      <div className="establishment-switcher establishment-switcher--single">
        <span className="establishment-switcher-trigger establishment-switcher-trigger--static">
          <span className="establishment-switcher-label">{only.name}</span>
        </span>
      </div>
    );
  }

  const handlePick = async (merchantId: string) => {
    if (merchantId === activeMerchantId) {
      setOpen(false);
      return;
    }

    setOpen(false);
    await switchMerchant(merchantId);
  };

  return (
    <div
      className={`establishment-switcher${open ? " establishment-switcher--open" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="establishment-switcher-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("establishments.switcherLabel")}
      >
        <span className="establishment-switcher-label">{activeEstablishment?.name}</span>
        <span className="establishment-switcher-chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <ul className="establishment-switcher-menu" role="listbox">
          {establishments.map((establishment) => (
            <li key={establishment.id} role="option" aria-selected={establishment.id === activeMerchantId}>
              <button
                type="button"
                className={`establishment-switcher-option${
                  establishment.id === activeMerchantId ? " establishment-switcher-option--active" : ""
                }`}
                onClick={() => void handlePick(establishment.id)}
              >
                <span className="establishment-switcher-option-label">{establishment.name}</span>
                {establishment.id === activeMerchantId && (
                  <span className="establishment-switcher-check" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
