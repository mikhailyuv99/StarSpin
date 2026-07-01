import { SocialIcon, type SocialBrand } from "./SocialIcons";

const SOCIAL_BRANDS: SocialBrand[] = ["google", "instagram", "tiktok", "facebook", "tripadvisor"];

export function SocialIconRow({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} aria-hidden>
      {SOCIAL_BRANDS.map((brand) => (
        <span key={brand} className="inline-flex shrink-0 items-center justify-center">
          <SocialIcon brand={brand} size={size} />
        </span>
      ))}
    </span>
  );
}
