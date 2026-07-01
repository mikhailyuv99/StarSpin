import { SocialIcon, type SocialBrand } from "./SocialIcons";

const SOCIAL_BRANDS: SocialBrand[] = ["google", "instagram", "tiktok", "facebook"];

export function SocialIconRow({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      {SOCIAL_BRANDS.map((brand) => (
        <span
          key={brand}
          className="inline-flex h-[1.35em] w-[1.35em] items-center justify-center rounded-md border-2 border-black bg-white"
        >
          <SocialIcon brand={brand} size={size} />
        </span>
      ))}
    </span>
  );
}
