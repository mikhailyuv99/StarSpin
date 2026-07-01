"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import "./cadeo-styles.css";

const PURPLE = "#6C5CE7";

function Nav() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg"
            style={{ background: PURPLE }}
          >
            RF
          </span>
          <span className="text-lg font-extrabold text-zinc-900">{t("common.brand")}</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-semibold text-zinc-600 hover:text-[#6C5CE7]">
            {t("marketing.navFeatures")}
          </a>
          <a href="#pricing" className="text-sm font-semibold text-zinc-600 hover:text-[#6C5CE7]">
            {t("marketing.navPricing")}
          </a>
          <a href="#faq" className="text-sm font-semibold text-zinc-600 hover:text-[#6C5CE7]">
            {t("marketing.navFaq")}
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher variant="light" />
          <Link href="/login" className="hidden text-sm font-semibold text-zinc-600 sm:block">
            {t("marketing.navLogin")}
          </Link>
          <Link href="/login" className="cadeo-btn-primary !px-4 !py-2.5 !text-sm">
            {t("marketing.navCta")}
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroWheel({ t }: { t: (k: string) => string }) {
  const slices = [
    { color: PURPLE, label: t("marketing.wheelSlice1") },
    { color: "#FD79A8", label: t("marketing.wheelSlice2") },
    { color: "#FDCB6E", label: t("marketing.wheelSlice3") },
    { color: "#55EFC4", label: t("marketing.wheelSlice4") },
    { color: "#A29BFE", label: "15%" },
    { color: "#FF7675", label: "VIP" },
  ];

  return (
    <div className="cadeo-wheel-float relative mx-auto w-full max-w-md">
      <div className="cadeo-blob -left-8 top-8 h-32 w-32 bg-[#FD79A8]" />
      <div className="cadeo-blob -right-4 bottom-4 h-40 w-40 bg-[#6C5CE7]" />
      <div className="relative">
        <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 text-3xl drop-shadow">▼</div>
        <div className="cadeo-wheel-spin rounded-full border-[6px] border-white p-2 shadow-2xl shadow-purple-200">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            {slices.map((s, i) => {
              const start = (i / slices.length) * 360;
              const end = ((i + 1) / slices.length) * 360;
              const mid = (start + end) / 2;
              const rad = ((mid - 90) * Math.PI) / 180;
              const tx = 100 + 58 * Math.cos(rad);
              const ty = 100 + 58 * Math.sin(rad);
              const large = end - start > 180 ? 1 : 0;
              const sRad = ((end - 90) * Math.PI) / 180;
              const eRad = ((start - 90) * Math.PI) / 180;
              const x1 = 100 + 90 * Math.cos(sRad);
              const y1 = 100 + 90 * Math.sin(sRad);
              const x2 = 100 + 90 * Math.cos(eRad);
              const y2 = 100 + 90 * Math.sin(eRad);
              return (
                <g key={i}>
                  <path
                    d={`M100 100 L${x1} ${y1} A90 90 0 ${large} 0 ${x2} ${y2} Z`}
                    fill={s.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${mid}, ${tx}, ${ty})`}
                    fill="#fff"
                    fontSize={8}
                    fontWeight={800}
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
            <circle cx="100" cy="100" r="24" fill="#fff" stroke={PURPLE} strokeWidth={3} />
            <text x="100" y="104" textAnchor="middle" fill={PURPLE} fontSize={11} fontWeight={900}>
              {t("marketing.wheelSpin")}
            </text>
          </svg>
        </div>
      </div>
      {/* Phone mockup frame */}
      <div className="absolute -bottom-6 -right-4 hidden rounded-3xl border-4 border-zinc-900 bg-zinc-900 p-1 shadow-xl sm:block">
        <div className="h-24 w-14 rounded-2xl bg-gradient-to-b from-[#6C5CE7] to-[#FD79A8]" />
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="cadeo-gradient-hero relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#6C5CE7] shadow-sm">
            ✨ {t("marketing.magicRecipe")}
          </p>
          <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem]">
            {t("marketing.heroTitle")}
            <br />
            <span className="bg-gradient-to-r from-[#6C5CE7] to-[#FD79A8] bg-clip-text text-transparent">
              {t("marketing.heroTitleAccent")}
            </span>
          </h1>
          <p className="mt-5 text-lg font-semibold text-zinc-700">{t("marketing.heroSubtitle")}</p>
          <p className="mt-2 text-base text-zinc-500">{t("marketing.heroBody")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="cadeo-btn-primary">
              {t("marketing.heroCta")}
            </Link>
            <a href="#features" className="cadeo-btn-outline">
              {t("marketing.heroDemo")}
            </a>
          </div>
          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t("marketing.trustedBy")}
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              {["Google ★ 4.9", "Trustpilot ★ 4.8"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-white px-4 py-2 text-sm font-bold text-zinc-800 shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
        <HeroWheel t={t} />
      </div>
    </section>
  );
}

function Pillars() {
  const { t } = useI18n();
  const items = [
    { emoji: "👀", text: t("marketing.pillar1") },
    { emoji: "🤝", text: t("marketing.pillar2") },
    { emoji: "📊", text: t("marketing.pillar3") },
    { emoji: "💜", text: t("marketing.pillar4") },
  ];
  return (
    <section className="border-y border-purple-100 bg-white py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-center text-2xl font-black text-zinc-900 sm:text-3xl">
          {t("marketing.pillarsTitle")}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.text} className="cadeo-card p-6 text-center">
              <span className="text-4xl">{item.emoji}</span>
              <p className="mt-3 text-sm font-bold leading-snug text-zinc-800">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureBlock({
  title,
  subtitle,
  body,
  reverse,
  children,
}: {
  title: string;
  subtitle: string;
  body: string;
  reverse?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
    >
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-[#6C5CE7]">{subtitle}</p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-zinc-900 sm:text-3xl">{title}</h3>
        <p className="mt-4 text-base leading-relaxed text-zinc-600">{body}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Features() {
  const { t } = useI18n();
  const visits = [
    { n: t("marketing.visit1"), a: t("marketing.visit1Action"), icon: "⭐" },
    { n: t("marketing.visit2"), a: t("marketing.visit2Action"), icon: "📸" },
    { n: t("marketing.visit3"), a: t("marketing.visit3Action"), icon: "🎵" },
    { n: t("marketing.visit4"), a: t("marketing.visit4Action"), icon: "👍" },
  ];

  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-6xl space-y-24 px-5 sm:px-8">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-[#6C5CE7]">
          {t("marketing.allFeatures")}
        </p>

        <FeatureBlock
          title={t("marketing.scanTitle")}
          subtitle={t("marketing.scanSubtitle")}
          body={t("marketing.scanBody")}
          children={
            <div className="cadeo-card flex aspect-video items-center justify-center bg-gradient-to-br from-[#EDE9FE] to-[#FDF2F8] p-8">
              <div className="text-center">
                <span className="text-6xl">📱</span>
                <p className="mt-4 text-5xl font-black text-[#6C5CE7]">QR</p>
              </div>
            </div>
          }
        />

        <FeatureBlock
          title={t("marketing.funTitle")}
          subtitle={t("marketing.funSubtitle")}
          body={t("marketing.funBody")}
          reverse
          children={
            <div className="cadeo-card flex aspect-video items-center justify-center gap-4 bg-gradient-to-br from-[#FFF9E6] to-[#EDE9FE] p-8">
              {["⭐", "❤️", "🎰"].map((e) => (
                <span key={e} className="text-5xl">
                  {e}
                </span>
              ))}
            </div>
          }
        />

        <div>
          <h3 className="text-2xl font-black text-zinc-900 sm:text-3xl">{t("marketing.visitsTitle")}</h3>
          <p className="mt-3 max-w-2xl text-zinc-600">{t("marketing.visitsBody")}</p>
          <div className="mt-8 space-y-3">
            {visits.map((v, i) => (
              <div
                key={v.n}
                className="cadeo-card flex items-center gap-4 p-4"
                style={{ marginLeft: `${i * 12}px` }}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDE9FE] text-xl">
                  {v.icon}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6C5CE7]">{v.n}</p>
                  <p className="font-bold text-zinc-900">{v.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cadeo-card bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] p-8 text-white sm:p-12">
          <p className="text-xl font-black sm:text-2xl">{t("marketing.quote")}</p>
          <p className="mt-4 text-white/85">{t("marketing.quoteBody")}</p>
          <p className="mt-4 text-sm font-bold text-[#FDCB6E]">— {t("marketing.quoteAuthor")}</p>
        </div>

        <FeatureBlock
          title={t("marketing.dataTitle")}
          subtitle="CRM"
          body={t("marketing.dataBody")}
          children={
            <div className="cadeo-card p-6">
              <div className="space-y-3">
                {["Name", "Phone", "Email ✓"].map((row) => (
                  <div key={row} className="flex items-center justify-between rounded-xl bg-[#F5F3FF] px-4 py-3 text-sm font-semibold">
                    <span className="text-zinc-500">{row}</span>
                    <span className="text-[#6C5CE7]">●</span>
                  </div>
                ))}
              </div>
            </div>
          }
        />

        <FeatureBlock
          title={t("marketing.prizeTitle")}
          subtitle="🎁"
          body={t("marketing.prizeBody")}
          reverse
          children={
            <div className="cadeo-card flex aspect-video flex-col items-center justify-center bg-[#FDCB6E]/20 p-8">
              <span className="text-7xl">🎁</span>
              <p className="mt-4 text-2xl font-black text-zinc-900">WIN!</p>
            </div>
          }
        />

        <div className="cadeo-section-alt rounded-3xl p-8 text-center sm:p-12">
          <h3 className="text-2xl font-black text-zinc-900 sm:text-3xl">{t("marketing.easyTitle")}</h3>
          <p className="mx-auto mt-4 max-w-xl text-zinc-600">{t("marketing.easyBody")}</p>
        </div>
      </div>
    </section>
  );
}

function Advantages() {
  const { t } = useI18n();
  const items = [t("marketing.adv1"), t("marketing.adv2"), t("marketing.adv3"), t("marketing.adv4")];
  return (
    <section className="cadeo-section-alt py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-center text-2xl font-black text-zinc-900">{t("marketing.advantagesTitle")}</h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="cadeo-card flex items-start gap-3 p-5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7] text-xs text-white">
                ✓
              </span>
              <span className="text-sm font-semibold text-zinc-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  const left = [
    t("marketing.priceF1"),
    t("marketing.priceF2"),
    t("marketing.priceF3"),
    t("marketing.priceF4"),
    t("marketing.priceF5"),
    t("marketing.priceF6"),
  ];
  const right = [
    t("marketing.priceF7"),
    t("marketing.priceF8"),
    t("marketing.priceF9"),
    t("marketing.priceF10"),
  ];
  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="cadeo-card overflow-hidden border-2 border-[#6C5CE7]/20">
          <div className="cadeo-gradient-cta px-6 py-4 text-center text-white sm:px-10">
            <p className="text-sm font-bold uppercase tracking-wider">{t("marketing.signupBanner")}</p>
            <p className="mt-1 text-lg font-black">{t("marketing.signupBannerSub")}</p>
          </div>
          <div className="p-8 sm:p-10">
            <div className="text-center">
              <h3 className="text-2xl font-black text-zinc-900">{t("marketing.pricingName")}</h3>
              <p className="mt-2">
                <span className="text-5xl font-black text-[#6C5CE7]">{t("marketing.pricingPrice")}</span>
                <span className="ml-2 text-zinc-500">{t("marketing.pricingPeriod")}</span>
              </p>
              <p className="mt-4 text-sm font-bold uppercase text-zinc-400">{t("marketing.pricingIncludes")}</p>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <ul className="space-y-2">
                {left.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-zinc-700">
                    <span className="text-[#6C5CE7]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {right.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-zinc-700">
                    <span className="text-[#6C5CE7]">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-10 text-center">
              <Link href="/login" className="cadeo-btn-primary">
                {t("marketing.heroCta")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const { t } = useI18n();
  const cards = [
    { industry: t("marketing.t1Industry"), stat: t("marketing.t1Stat"), quote: t("marketing.t1Quote") },
    { industry: t("marketing.t2Industry"), stat: t("marketing.t2Stat"), quote: "" },
    { industry: t("marketing.t3Industry"), stat: t("marketing.t3Stat"), quote: "" },
  ];
  const doubled = [...cards, ...cards, ...cards, ...cards];
  return (
    <section className="overflow-hidden py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-center text-2xl font-black text-zinc-900">{t("marketing.testimonialsTitle")}</h2>
        <p className="mt-2 text-center text-zinc-500">{t("marketing.testimonialsSub")}</p>
      </div>
      <div className="mt-10 overflow-hidden">
        <div className="cadeo-testimonial-track px-5">
          {doubled.map((card, i) => (
            <div key={i} className="cadeo-card w-72 shrink-0 p-6">
              <p className="text-xs font-bold uppercase text-[#6C5CE7]">{card.industry}</p>
              <p className="mt-2 text-xl font-black text-zinc-900">{card.stat}</p>
              {card.quote && <p className="mt-3 text-sm text-zinc-600">&ldquo;{card.quote}&rdquo;</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { q: t("marketing.faq1Q"), a: t("marketing.faq1A") },
    { q: t("marketing.faq2Q"), a: t("marketing.faq2A") },
    { q: t("marketing.faq3Q"), a: t("marketing.faq3A") },
    { q: t("marketing.faq4Q"), a: t("marketing.faq4A") },
  ];
  return (
    <section id="faq" className="cadeo-section-alt py-20">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <h2 className="text-center text-3xl font-black text-zinc-900">{t("marketing.faqTitle")}</h2>
        <p className="mt-2 text-center text-zinc-500">{t("marketing.faqSub")}</p>
        <div className="mt-10 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="cadeo-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold text-zinc-900"
              >
                {item.q}
                <span className="text-2xl text-[#6C5CE7]">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <div className="border-t border-purple-50 px-5 pb-5 text-sm leading-relaxed text-zinc-600">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CookieBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-lg items-center justify-between gap-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-xl sm:left-auto sm:right-6">
      <p className="text-sm font-medium text-zinc-700">{t("marketing.cookieText")}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="shrink-0 rounded-full bg-[#6C5CE7] px-4 py-2 text-xs font-bold text-white"
      >
        {t("marketing.cookieAccept")}
      </button>
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-purple-100 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 sm:flex-row sm:px-8">
        <p className="text-sm text-zinc-500">
          {t("marketing.footerRights", { year: new Date().getFullYear() })}
        </p>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-semibold text-[#6C5CE7]">
            {t("marketing.navLogin")}
          </Link>
          <a href="mailto:hello@rouefidelite.com" className="cadeo-btn-outline !py-2 !text-sm">
            {t("marketing.footerDemo")}
          </a>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="cadeo-page min-h-screen bg-white text-zinc-900">
      <Nav />
      <main>
        <Hero />
        <Pillars />
        <Features />
        <Advantages />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
