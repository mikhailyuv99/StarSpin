"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useTranslations } from "@/i18n/client";

export type MobileMenuItem =
  | { type: "link"; href: string; label: string; emphasis?: boolean }
  | { type: "anchor"; href: string; label: string }
  | { type: "button"; label: string; onClick: () => void | Promise<void>; danger?: boolean };

export function BrutalMobileMenu({
  items,
  className = "",
}: {
  items: MobileMenuItem[];
  className?: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`brutal-mobile-menu ${className}`.trim()}>
      <button
        type="button"
        className="brutal-mobile-menu-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("common.menu")}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="brutal-mobile-menu-icon" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="brutal-mobile-menu-backdrop"
            aria-label={t("common.cancel")}
            onClick={() => setOpen(false)}
          />
          <nav id={panelId} className="brutal-mobile-menu-panel" aria-label={t("common.menu")}>
            {items.map((item) => {
              if (item.type === "link") {
                return (
                  <Link
                    key={`${item.type}-${item.href}`}
                    href={item.href}
                    className={`brutal-mobile-menu-item${item.emphasis ? " brutal-mobile-menu-item--cta" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }
              if (item.type === "anchor") {
                return (
                  <a
                    key={`${item.type}-${item.href}`}
                    href={item.href}
                    className="brutal-mobile-menu-item"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <button
                  key={`${item.type}-${item.label}`}
                  type="button"
                  className={`brutal-mobile-menu-item${item.danger ? " brutal-mobile-menu-item--danger" : ""}`}
                  onClick={() => {
                    setOpen(false);
                    void item.onClick();
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
