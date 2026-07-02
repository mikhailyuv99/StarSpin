import type { MarketingAdvantage } from "@/lib/marketing-advantages";

export function AdvantageCopy({ title, desc }: Pick<MarketingAdvantage, "title" | "desc">) {
  return (
    <span className="cadeo-adv-copy">
      <strong className="cadeo-adv-title">{title}</strong>
      <span className="cadeo-adv-desc">{desc}</span>
    </span>
  );
}
