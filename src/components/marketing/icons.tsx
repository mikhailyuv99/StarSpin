type IconProps = { className?: string };

export function IconLayers({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="square" d="M12 4L3 9l9 5 9-5-9-5zM3 15l9 5 9-5M3 12l9 5 9-5" />
    </svg>
  );
}

export function IconFlow({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="square" d="M4 6h16M4 12h10M4 18h6" />
      <path strokeLinecap="square" d="M18 11l3 1-3 1v-2z" />
    </svg>
  );
}

export function IconWheel({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="square" d="M12 4v8l5 5" />
    </svg>
  );
}

export function IconShield({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="square" d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
    </svg>
  );
}

export function IconChart({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="square" d="M4 19h16M7 16V9M12 16V5M17 16v-4" />
    </svg>
  );
}

export function IconPin({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="square" d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function IconCheck({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M5 13l4 4L19 7" />
    </svg>
  );
}
