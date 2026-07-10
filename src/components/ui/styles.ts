/** Shared UI tokens — Cadeo neo-brutalist theme */

export const ui = {
  page: "brutal-page",
  pageMuted: "brutal-page",
  shell: "mx-auto max-w-5xl px-4 py-8 sm:px-6",
  shellNarrow: "mx-auto max-w-xl px-4 py-8 sm:px-6",

  card: "brutal-card p-6",
  cardFlat: "brutal-card p-5",
  cardGrid:
    "brutal-card p-6 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5",

  h1: "font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase tracking-tight text-ink",
  h2: "font-[family-name:var(--font-display)] text-xl font-extrabold uppercase tracking-tight text-ink",
  label: "brutal-label",
  muted: "text-sm font-medium text-muted",
  link: "font-bold text-ink underline decoration-2 underline-offset-4 hover:opacity-80",

  input: "brutal-input",
  file:
    "w-full text-sm font-medium text-muted file:mr-3 file:rounded-[14px] file:border-2 file:border-black file:bg-[var(--c-yellow)] file:px-3 file:py-1.5 file:text-xs file:font-extrabold file:text-black",

  btn: "brutal-btn brutal-btn-purple",
  btnYellow: "brutal-btn brutal-btn-yellow",
  btnOutline: "brutal-btn brutal-btn-white",
  btnDanger:
    "brutal-btn brutal-btn-white !border-red-700 !text-red-800 !bg-red-50 text-sm !py-1.5 !px-3",
  btnSuccess:
    "brutal-btn brutal-btn-white !bg-[var(--c-mint)] text-sm !py-1.5 !px-3",

  alertError: "brutal-alert-error",
  alertSuccess: "brutal-alert-success",

  stat: "brutal-stat",
  statLabel: "text-[10px] font-extrabold uppercase tracking-wider text-muted",
  statValue: "mt-2 font-mono text-3xl font-bold text-ink",

  table: "brutal-table w-full text-left text-sm",
  th: "border-b-[2.5px] border-black bg-[var(--c-cream)] px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted",
  td: "border-b border-zinc-200 px-4 py-3 text-sm font-medium text-ink",
} as const;
