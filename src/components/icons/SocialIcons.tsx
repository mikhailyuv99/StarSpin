"use client";

import { useId } from "react";
import type { SimpleIcon } from "simple-icons";
import {
  siFacebook,
  siGoogle,
  siInstagram,
  siTiktok,
  siTripadvisor,
} from "simple-icons";

export type SocialBrand = "google" | "instagram" | "tiktok" | "facebook" | "tripadvisor";

type SocialIconProps = {
  brand: SocialBrand;
  size?: number;
  className?: string;
  title?: string;
};

const BRAND_ICONS: Record<Exclude<SocialBrand, "google" | "instagram" | "tiktok">, SimpleIcon> = {
  facebook: siFacebook,
  tripadvisor: siTripadvisor,
};

/** Official Instagram glyph (Meta brand asset path + gradient). */
function InstagramIcon({ size, className, label }: { size: number; className: string; label: string }) {
  const gradId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <defs>
        <radialGradient id={gradId} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285aeb" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
      />
    </svg>
  );
}

/** Official TikTok note — white glyph with cyan/red chromatic offset (brand style). */
const TIKTOK_NOTE_PATH =
  "M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.311-4.644 2.933 2.933 0 0 1 .881.135V9.31a6.844 6.844 0 0 0-1.005-.058 6.33 6.33 0 0 0-6.333 6.334 6.33 6.33 0 0 0 10.864-4.429v-6.89a8.213 8.213 0 0 0 4.773 1.529V6.686a4.793 4.793 0 0 1-1.12-.001z";

function TikTokIcon({ size, className, label }: { size: number; className: string; label: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <path fill="#25F4EE" d={TIKTOK_NOTE_PATH} transform="translate(-0.8, -0.8)" />
      <path fill="#FE2C55" d={TIKTOK_NOTE_PATH} transform="translate(0.8, 0.8)" />
      <path fill="#FFFFFF" d={TIKTOK_NOTE_PATH} />
    </svg>
  );
}

function SimpleBrandIcon({
  icon,
  size,
  className,
  label,
}: {
  icon: SimpleIcon;
  size: number;
  className: string;
  label: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}

function GoogleIcon({ size, className, label }: { size: number; className: string; label: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function SocialIcon({ brand, size = 18, className = "", title }: SocialIconProps) {
  const label =
    title ??
    (brand === "google"
      ? siGoogle.title
      : brand === "instagram"
        ? siInstagram.title
        : brand === "tiktok"
          ? siTiktok.title
          : BRAND_ICONS[brand].title);

  if (brand === "google") {
    return <GoogleIcon size={size} className={className} label={label} />;
  }
  if (brand === "instagram") {
    return <InstagramIcon size={size} className={className} label={label} />;
  }
  if (brand === "tiktok") {
    return <TikTokIcon size={size} className={className} label={label} />;
  }

  return (
    <SimpleBrandIcon icon={BRAND_ICONS[brand]} size={size} className={className} label={label} />
  );
}
