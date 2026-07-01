import { useId } from "react";

export type SocialBrand = "google" | "instagram" | "tiktok" | "facebook";

type SocialIconProps = {
  brand: SocialBrand;
  size?: number;
  className?: string;
  title?: string;
};

export function SocialIcon({ brand, size = 18, className = "", title }: SocialIconProps) {
  const label = title ?? brand;
  const gradId = useId();

  switch (brand) {
    case "google":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={className}
          role="img"
          aria-label={label}
        >
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
    case "instagram":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={className}
          role="img"
          aria-label={label}
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FD5949" />
              <stop offset="50%" stopColor="#D6249F" />
              <stop offset="100%" stopColor="#285AEB" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#${gradId})`} />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="#fff" />
        </svg>
      );
    case "tiktok":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={className}
          role="img"
          aria-label={label}
        >
          <rect width="24" height="24" rx="6" fill="#010101" />
          <path
            fill="#25F4EE"
            d="M15.6 8.1V7.1c-.5 0-1-.1-1.4-.3a3.4 3.4 0 0 1-1.3-1.1 3.6 3.6 0 0 1-.6-1.4h-2.8v9.8a2.4 2.4 0 1 1-2.4-2.4c.2 0 .5 0 .7.1v-2.9a5.3 5.3 0 1 0 5.3 5.3V10.2c1 .7 2.2 1.1 3.5 1.1V8.5c-.5 0-1-.1-1.4-.4z"
          />
          <path
            fill="#FE2C55"
            d="M15.6 8.5v1.8c-1.3 0-2.5-.4-3.5-1.1v5.4a5.3 5.3 0 1 1-5.3-5.3c.2 0 .5 0 .7.1v2.9a2.4 2.4 0 1 0 2.4 2.4V5.3h2.8c.1.5.3 1 .6 1.4.3.5.7.8 1.3 1.1.4.2.9.3 1.4.3z"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={className}
          role="img"
          aria-label={label}
        >
          <rect width="24" height="24" rx="6" fill="#1877F2" />
          <path
            fill="#fff"
            d="M16.7 15.4 17.2 12h-3.2V10c0-.8.3-1.4 1.5-1.4H17.4V6.1S16.1 5.9 14.8 5.9c-2.7 0-4.5 1.6-4.5 4.6V12H7.5v3.4h2.8v8.7h3.7v-8.7h3.1l.6-3.4z"
          />
        </svg>
      );
  }
}
