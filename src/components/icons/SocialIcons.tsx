import { useId } from "react";

export type SocialBrand = "google" | "instagram" | "tiktok" | "facebook" | "tripadvisor";

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
              <stop offset="0%" stopColor="#F58529" />
              <stop offset="35%" stopColor="#DD2A7B" />
              <stop offset="65%" stopColor="#8134AF" />
              <stop offset="100%" stopColor="#515BD4" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="7" fill={`url(#${gradId})`} />
          <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="3.4" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.6" cy="6.4" r="1.15" fill="#fff" />
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
          <rect width="24" height="24" rx="7" fill="#000" />
          <path
            fill="#25F4EE"
            d="M16.8 7.2v1.4c-1.2 0-2.3-.4-3.2-1.1v6.8a4.2 4.2 0 1 1-3.6-4.15v1.6a2.5 2.5 0 1 0 1.8 2.4V5.8h1.7c.1.9.5 1.7 1.1 2.3.6.6 1.4 1 2.2 1.1Z"
          />
          <path
            fill="#FE2C55"
            d="M16.8 8.6v6.8a4.2 4.2 0 0 1-7.8-2.1v1.6a2.5 2.5 0 1 0 2.5 2.5V5.8h1.7c.1.9.5 1.7 1.1 2.3.7.6 1.5 1 2.5 1.1v-1.4c-.9-.1-1.7-.5-2.3-1.1-.6-.6-1-1.4-1.1-2.3h-1.7v9.1a2.5 2.5 0 0 0-2.5-2.5v1.6a4.2 4.2 0 0 0 7.8 2.1V8.6c.9.7 2 1.1 3.2 1.1Z"
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
          <rect width="24" height="24" rx="7" fill="#1877F2" />
          <path
            fill="#fff"
            d="M13.7 8.2h2V5.4h-2c-2.3 0-3.7 1.4-3.7 3.8V12H8v2.8h2v7.2h3.1v-7.2h2.6l.5-2.8H13v-1.6c0-.8.2-1.4 1.4-1.4Z"
          />
        </svg>
      );
    case "tripadvisor":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={className}
          role="img"
          aria-label={label}
        >
          <circle cx="12" cy="12" r="11" fill="#34E0A1" stroke="#0a0a0a" strokeWidth="1.2" />
          <circle cx="8.4" cy="11.2" r="2.35" fill="#fff" stroke="#0a0a0a" strokeWidth="1.1" />
          <circle cx="15.6" cy="11.2" r="2.35" fill="#fff" stroke="#0a0a0a" strokeWidth="1.1" />
          <circle cx="8.4" cy="11.2" r="1.05" fill="#0a0a0a" />
          <circle cx="15.6" cy="11.2" r="1.05" fill="#0a0a0a" />
          <path
            fill="#0a0a0a"
            d="M10.1 15.1c.8.9 1.9 1.4 3.1 1.4 1.2 0 2.3-.5 3.1-1.4l.8.8c-1 .9-2.3 1.5-3.9 1.5s-2.9-.6-3.9-1.5l.8-.8Z"
          />
          <path fill="#0a0a0a" d="M11.2 14.1h1.6l-.2 1.4h-1.2l-.2-1.4Z" />
        </svg>
      );
  }
}
