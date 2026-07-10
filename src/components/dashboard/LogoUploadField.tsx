"use client";

import { useRef } from "react";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

export function LogoUploadField({
  logoUrl,
  onUpload,
  label,
}: {
  logoUrl: string | null;
  onUpload: (file: File) => void | Promise<void>;
  label?: string;
}) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLogo = Boolean(logoUrl);

  return (
    <div>
      {label ? <label className={ui.label}>{label}</label> : null}
      <div className={`${label ? "mt-2" : ""} flex items-center gap-3`}>
        {hasLogo ? (
          <img
            src={logoUrl!}
            alt=""
            className="h-16 w-16 shrink-0 rounded-[14px] border-2 border-black object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] border-2 border-dashed border-black/30 bg-[var(--c-cream)] text-xs font-bold text-muted">
            —
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-sm font-semibold leading-none text-ink">
            {hasLogo ? t("dashboard.logoActive") : t("dashboard.logoNone")}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`${ui.btnOutline} !w-auto shrink-0 px-4 py-2 text-sm`}
          >
            {hasLogo ? t("dashboard.changeLogo") : t("dashboard.uploadLogo")}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
