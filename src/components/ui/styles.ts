/** Shared UI tokens — Halve-inspired: white, ink, sharp edges, minimal chrome */

export const ui = {
  page: "min-h-screen bg-white text-ink",
  pageMuted: "min-h-screen bg-surface text-ink",
  shell: "mx-auto max-w-5xl px-5 py-8 sm:px-8",
  shellNarrow: "mx-auto max-w-xl px-5 py-8 sm:px-8",

  card: "rounded-sm border border-border bg-white p-6",
  cardFlat: "rounded-sm border border-border bg-white p-5",
  cardGrid: "rounded-sm border border-border bg-white p-6 transition-colors hover:border-zinc-400",

  h1: "text-2xl font-semibold tracking-tight text-ink",
  h2: "text-xl font-semibold tracking-tight text-ink",
  label: "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted",
  muted: "text-sm text-muted",
  link: "font-medium text-ink underline decoration-border underline-offset-4 hover:decoration-ink",

  input:
    "w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-zinc-400 focus:border-ink focus:ring-1 focus:ring-ink",
  file: "w-full text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white",

  btn:
    "inline-flex items-center justify-center rounded-sm bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50",
  btnOutline:
    "inline-flex items-center justify-center rounded-sm border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-50",
  btnDanger:
    "inline-flex items-center justify-center rounded-sm border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50",
  btnSuccess:
    "inline-flex items-center justify-center rounded-sm border border-emerald-200 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50",

  alertError: "rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800",
  alertSuccess: "rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800",

  stat: "rounded-sm border border-border bg-white p-5",
  statLabel: "text-[11px] font-semibold uppercase tracking-wider text-muted",
  statValue: "mt-2 font-mono text-3xl font-medium text-ink",

  table: "w-full text-left text-sm",
  th: "border-b border-border bg-surface px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted",
  td: "border-b border-border px-4 py-3 text-ink",
} as const;
