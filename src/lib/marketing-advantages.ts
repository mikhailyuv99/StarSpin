import type { TFunction } from "@/i18n/translate";

export type MarketingAdvantage = {
  num: string;
  title: string;
  desc: string;
};

export function getMarketingAdvantages(t: TFunction): MarketingAdvantage[] {
  return [
    { num: "01", title: t("marketing.adv1Title"), desc: t("marketing.adv1Desc") },
    { num: "02", title: t("marketing.adv2Title"), desc: t("marketing.adv2Desc") },
    { num: "03", title: t("marketing.adv3Title"), desc: t("marketing.adv3Desc") },
    { num: "04", title: t("marketing.adv4Title"), desc: t("marketing.adv4Desc") },
  ];
}
