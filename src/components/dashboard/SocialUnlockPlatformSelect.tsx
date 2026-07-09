"use client";

import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { useI18n } from "@/i18n/client";
import {
  SOCIAL_UNLOCK_PLATFORMS,
  type SocialUnlockPlatform,
} from "@/lib/prize-mechanics";
import type { SocialLinks } from "@/lib/types";

const optionBase =
  "brutal-btn flex w-full items-center justify-center gap-2.5 px-3 py-2.5 text-sm font-bold transition-[transform,box-shadow] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-45";

export function SocialUnlockPlatformSelect({
  value,
  onChange,
  socialLinks,
  disabled,
}: {
  value: SocialUnlockPlatform | "";
  onChange: (platform: SocialUnlockPlatform) => void;
  socialLinks: SocialLinks;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted">{t("dashboard.socialUnlockPlatformHint")}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {SOCIAL_UNLOCK_PLATFORMS.map((platform) => {
          const url = socialLinks[platform]?.trim();
          const selected = value === platform;
          const brand = platform as SocialBrand;
          return (
            <button
              key={platform}
              type="button"
              disabled={disabled}
              onClick={() => onChange(platform)}
              className={`${optionBase} ${selected ? "brutal-btn" : "brutal-btn-white"}`}
              aria-pressed={selected}
            >
              <SocialIcon brand={brand} size={20} />
              <span>{t(`dashboard.socialUnlockPlatform_${platform}`)}</span>
            </button>
          );
        })}
      </div>
      {value && !socialLinks[value]?.trim() && (
        <p className="text-xs font-semibold text-amber-700" role="status">
          {t("dashboard.socialUnlockUrlMissing", {
            platform: t(`dashboard.socialUnlockPlatform_${value}`),
          })}
        </p>
      )}
    </div>
  );
}
