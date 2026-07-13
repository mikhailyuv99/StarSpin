"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useTranslations } from "@/i18n/client";
import { publicMerchantMenuPath, publicMerchantPlayPath } from "@/lib/app-url";

type Props = {
  slug: string;
  name: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
};

export function MerchantHub({ slug, name, logoUrl, primaryColor, secondaryColor }: Props) {
  const t = useTranslations();

  return (
    <div
      className="flex min-h-dvh flex-col px-5 pb-10 pt-8"
      style={{
        background: `linear-gradient(165deg, ${secondaryColor}22 0%, #fff8f1 42%, ${primaryColor}18 100%)`,
      }}
    >
      <div className="mb-6 flex justify-end">
        <LocaleSwitcher variant="journey" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- direct CDN for fast LCP
          <img
            src={logoUrl}
            alt={name}
            width={96}
            height={96}
            decoding="async"
            fetchPriority="high"
            className="mb-5 h-24 w-24 rounded-full object-cover shadow-sm ring-4 ring-white"
          />
        ) : (
          <div
            className="mb-5 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{name}</h1>
        <p className="mt-2 max-w-xs text-sm text-zinc-600">{t("public.hubSubtitle")}</p>

        <div className="mt-10 flex w-full flex-col gap-3">
          <Link
            href={publicMerchantMenuPath(slug)}
            className="rounded-2xl px-5 py-4 text-center text-base font-semibold text-white transition hover:opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            {t("public.hubMenu")}
          </Link>
          <Link
            href={publicMerchantPlayPath(slug)}
            className="rounded-2xl border-2 bg-white/80 px-5 py-4 text-center text-base font-semibold text-zinc-900 transition hover:bg-white"
            style={{ borderColor: primaryColor }}
          >
            {t("public.hubPlay")}
          </Link>
        </div>
      </div>
    </div>
  );
}
