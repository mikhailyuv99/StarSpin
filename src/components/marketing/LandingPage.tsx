"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { SocialIconRow } from "@/components/icons/SocialIconRow";
import { CONTACT_EMAIL } from "@/lib/brand";
import { MarketingSpinWheel } from "@/components/marketing/MarketingSpinWheel";
import { PricingPlans } from "@/components/billing/PricingPlans";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { marketingImages } from "@/lib/marketing-images";
import { BrutalMobileMenu, type MobileMenuItem } from "@/components/BrutalMobileMenu";
import { AdvantageCopy } from "@/components/marketing/AdvantageCopy";
import { getMarketingAdvantages } from "@/lib/marketing-advantages";
import "./cadeo-styles.css";

/** Lightweight client-side auth check so the nav/hero can point straight to the dashboard. */
function useIsAuthed() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    let active = true;
    try {
      const supabase = createClient();
      void supabase.auth.getSession().then(({ data }) => {
        if (active) setAuthed(Boolean(data.session));
      });
    } catch {
      /* env missing (local) — stay logged-out */
    }
    return () => {
      active = false;
    };
  }, []);
  return authed;
}

function Logo() {
  return <StarspinLogo href="/" variant="light" size="md" />;
}

function Nav({ authed }: { authed: boolean }) {
  const { t } = useI18n();
  const menuItems: MobileMenuItem[] = [
    { type: "anchor", href: "#how", label: t("marketing.navHow") },
    { type: "anchor", href: "#pricing", label: t("marketing.navPricing") },
    { type: "anchor", href: "#faq", label: t("marketing.navFaq") },
    ...(authed
      ? [{ type: "link" as const, href: "/dashboard", label: t("marketing.navDashboard"), emphasis: true }]
      : [
          { type: "link" as const, href: "/login", label: t("marketing.navLogin") },
          { type: "link" as const, href: "/login?mode=signup", label: t("marketing.navSignup"), emphasis: true },
        ]),
  ];

  return (
    <div className="cadeo-nav-wrap">
      <nav className="cadeo-nav">
        <Logo />
        <div className="cadeo-nav-links">
          <a href="#how">{t("marketing.navHow")}</a>
          <a href="#pricing">{t("marketing.navPricing")}</a>
          <a href="#faq">{t("marketing.navFaq")}</a>
        </div>
        <div className="cadeo-nav-actions">
          {authed ? (
            <Link href="/dashboard" className="cadeo-btn cadeo-btn-yellow cadeo-nav-auth-btn">
              {t("marketing.navDashboard")}
            </Link>
          ) : (
            <>
              <Link href="/login" className="cadeo-btn cadeo-btn-outline cadeo-nav-auth-btn">
                {t("marketing.navLogin")}
              </Link>
              <Link href="/login?mode=signup" className="cadeo-btn cadeo-btn-yellow cadeo-nav-auth-btn">
                {t("marketing.navSignup")}
              </Link>
            </>
          )}
          <div className="cadeo-nav-locale">
            <LocaleSwitcher variant="brutal" />
          </div>
          <BrutalMobileMenu items={menuItems} className="cadeo-nav-burger" />
        </div>
      </nav>
    </div>
  );
}

function Hero({ authed }: { authed: boolean }) {
  const { t } = useI18n();
  const badges: { cls: string; brand: SocialBrand; text: string }[] = [
    { cls: "cadeo-stat-badge--white", brand: "google", text: "+351 Google" },
    { cls: "cadeo-stat-badge--mint", brand: "tripadvisor", text: "+251 TripAdvisor" },
    { cls: "cadeo-stat-badge--yellow", brand: "tiktok", text: "+150 TikTok" },
    { cls: "cadeo-stat-badge--pink", brand: "instagram", text: "+251 Instagram" },
  ];

  return (
    <section className="cadeo-hero">
      <div className="cadeo-hero-inner">
        <Reveal className="cadeo-hero-copy" y={36}>
          <p className="cadeo-hero-eyebrow">{t("marketing.heroEyebrow")}</p>
          <h1>
            <span className="cadeo-hero-line">{t("marketing.heroTitle")}</span>
            <span className="cadeo-hero-accent">{t("marketing.heroTitleAccent")}</span>
          </h1>
          <p className="cadeo-hero-lead">{t("marketing.heroSubtitle")}</p>
          <div className="cadeo-hero-actions">
            {authed ? (
              <Link href="/dashboard" className="cadeo-btn cadeo-btn-yellow cadeo-btn-lg">
                {t("marketing.navDashboard")}
              </Link>
            ) : (
              <Link href="/login?mode=signup" className="cadeo-btn cadeo-btn-yellow cadeo-btn-lg">
                {t("marketing.heroSignup")}
              </Link>
            )}
            <a href="#how" className="cadeo-btn cadeo-btn-outline cadeo-btn-lg">
              {t("marketing.navHow")}
            </a>
          </div>
          <p className="cadeo-hero-mini-trust">{t("marketing.heroTrialNote")}</p>
        </Reveal>

        <Reveal className="cadeo-hero-visual" y={40} delay={0.08}>
          <div className="cadeo-hero-scene">
            <div className="cadeo-hero-badges">
              {badges.map((b, i) => (
                <Reveal key={b.text} delay={0.12 + i * 0.06} y={20}>
                  <div className={`cadeo-stat-badge ${b.cls}`}>
                    <span className="cadeo-stat-badge-icon">
                      <SocialIcon brand={b.brand} size={16} />
                    </span>
                    <span className="cadeo-stat-badge-text">{b.text}</span>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="cadeo-hero-photo">
              <Image
                src={marketingImages.heroRestaurant}
                alt=""
                fill
                sizes="(max-width: 768px) 88vw, 420px"
                className="cadeo-hero-photo-img"
                priority
              />
              <div className="cadeo-hero-photo-shade" />
              <div className="cadeo-hero-photo-tag">QR → Play → Win</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function JourneyPhoneScan() {
  const { t } = useI18n();
  return (
    <div className="cadeo-jphone" aria-hidden>
      <span className="cadeo-jnotch" />
      <div className="cadeo-jscreen cadeo-jscreen--game">
        <div className="cadeo-jgame">
          <span className="cadeo-jvenue">{t("marketing.journeyVenue")}</span>
          <p className="cadeo-jgame-title">{t("marketing.journeyPlay")}</p>
          <div className="cadeo-jwheel">
            <MarketingSpinWheel size={130} animate />
          </div>
          <span className="cadeo-jgame-btn">{t("public.wheelSpin")}</span>
        </div>
      </div>
    </div>
  );
}

function JourneyPhoneTasks() {
  const { t } = useI18n();
  const tasks: { brand: SocialBrand; label: string; done?: boolean }[] = [
    { brand: "google", label: t("public.reviewTitleFirst"), done: true },
    { brand: "instagram", label: t("public.follow_instagram") },
    { brand: "facebook", label: t("public.follow_facebook") },
    { brand: "tiktok", label: t("public.follow_tiktok") },
    { brand: "tripadvisor", label: t("public.follow_tripadvisor") },
  ];
  return (
    <div className="cadeo-jphone" aria-hidden>
      <span className="cadeo-jnotch" />
      <div className="cadeo-jscreen cadeo-jscreen--tasks">
        <div className="cadeo-jtasks cadeo-jtasks--dense">
          <p className="cadeo-jtasks-title">{t("public.headerSubtitle")}</p>
          {tasks.map((task) => (
            <div key={task.label} className={`cadeo-jtask ${task.done ? "cadeo-jtask--done" : ""}`}>
              <span className="cadeo-jtask-ic">
                <SocialIcon brand={task.brand} size={14} />
              </span>
              <span className="cadeo-jtask-label">{task.label}</span>
              <span className="cadeo-jtask-check">{task.done ? "✓" : ""}</span>
            </div>
          ))}
          <div className="cadeo-jtask-bar">
            <div className="cadeo-jtask-bar-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyPhoneWin() {
  const { t } = useI18n();
  return (
    <div className="cadeo-jphone" aria-hidden>
      <span className="cadeo-jnotch" />
      <div className="cadeo-jscreen cadeo-jscreen--win">
        <div className="cadeo-jwin">
          <span className="cadeo-jwin-badge">{t("public.claimTitle")}</span>
          <p className="cadeo-jwin-prize">{t("marketing.wheelSlice2")}</p>
          <div className="cadeo-jfield">{t("public.claimFirstName")}</div>
          <div className="cadeo-jfield">{t("public.claimEmail")}</div>
          <div className="cadeo-jfield cadeo-jfield--phone">{t("public.claimPhoneOptional")}</div>
          <span className="cadeo-jclaim-btn">{t("public.claimSubmit")}</span>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { n: "1", phone: <JourneyPhoneScan />, title: t("marketing.howStep1Title"), body: t("marketing.howStep1Body") },
    { n: "2", phone: <JourneyPhoneTasks />, title: t("marketing.howStep2Title"), body: t("marketing.howStep2Body") },
    { n: "3", phone: <JourneyPhoneWin />, title: t("marketing.howStep3Title"), body: t("marketing.howStep3Body") },
  ];

  return (
    <section id="how" className="cadeo-section cadeo-how-section">
      <div className="cadeo-section-inner">
        <Reveal className="cadeo-section-head">
          <p className="cadeo-section-eyebrow">{t("marketing.howEyebrow")}</p>
          <h2 className="cadeo-h2 text-center">{t("marketing.howTitle")}</h2>
          <p className="cadeo-sub mx-auto max-w-xl text-center">{t("marketing.howSub")}</p>
        </Reveal>
        <RevealStagger className="cadeo-journey">
          {steps.map((step) => (
            <RevealItem key={step.n} className="cadeo-journey-step">
              <div className="cadeo-journey-phone-wrap">
                <span className="cadeo-journey-num">{step.n}</span>
                {step.phone}
              </div>
              <h3 className="cadeo-journey-title">{step.title}</h3>
              <p className="cadeo-journey-body">{step.body}</p>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

function AdvVisualJourney() {
  const chips: { brand: SocialBrand; label: string }[] = [
    { brand: "google", label: "Google" },
    { brand: "instagram", label: "IG" },
    { brand: "tiktok", label: "TikTok" },
    { brand: "facebook", label: "FB" },
  ];
  return (
    <div className="cadeo-adv-visual cadeo-adv-visual--journey" aria-hidden>
      <div className="cadeo-adv-flow">
        {chips.map((chip, i) => (
          <div key={chip.label} className="cadeo-adv-flow-chip">
            <span className="cadeo-adv-flow-num">{i + 1}</span>
            <span className="cadeo-adv-flow-icon">
              <SocialIcon brand={chip.brand} size={14} />
            </span>
            <span>{chip.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvVisualWheel() {
  return (
    <div className="cadeo-adv-visual cadeo-adv-visual--wheel" aria-hidden>
      <MarketingSpinWheel size={88} animate />
      <div className="cadeo-adv-odds">
        <span>40%</span>
        <span>25%</span>
        <span>15%</span>
      </div>
    </div>
  );
}

function AdvVisualCrm() {
  return (
    <div className="cadeo-adv-visual cadeo-adv-visual--crm" aria-hidden>
      <div className="cadeo-adv-bars">
        <span style={{ height: "42%" }} />
        <span style={{ height: "68%" }} />
        <span style={{ height: "55%" }} />
        <span style={{ height: "88%" }} />
        <span style={{ height: "72%" }} />
      </div>
      <div className="cadeo-adv-crm-stats">
        <div>
          <strong>128</strong>
          <em>spins</em>
        </div>
        <div>
          <strong>64</strong>
          <em>contacts</em>
        </div>
        <div>
          <strong>CSV</strong>
          <em>export</em>
        </div>
      </div>
    </div>
  );
}

function AdvVisualBrand() {
  return (
    <div className="cadeo-adv-visual cadeo-adv-visual--brand" aria-hidden>
      <div className="cadeo-adv-brand-card">
        <div className="cadeo-adv-brand-top">
          <span className="cadeo-adv-brand-logo">SS</span>
          <span>YOUR VENUE</span>
        </div>
        <div className="cadeo-adv-brand-qr">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="cadeo-adv-swatches">
          <i className="cadeo-adv-swatch cadeo-adv-swatch--lavender" />
          <i className="cadeo-adv-swatch cadeo-adv-swatch--yellow" />
          <i className="cadeo-adv-swatch cadeo-adv-swatch--pink" />
          <i className="cadeo-adv-swatch cadeo-adv-swatch--mint" />
        </div>
      </div>
    </div>
  );
}

const ADV_VISUALS = [AdvVisualJourney, AdvVisualWheel, AdvVisualCrm, AdvVisualBrand];

function WhatYouGet() {
  const { t } = useI18n();
  const items = getMarketingAdvantages(t);

  return (
    <section id="features" className="cadeo-section cadeo-section--tight-top">
      <div className="cadeo-section-inner">
        <Reveal className="cadeo-section-head">
          <p className="cadeo-section-eyebrow">{t("marketing.pillarsEyebrow")}</p>
          <h2 className="cadeo-h2 text-center">{t("marketing.advantagesTitle")}</h2>
        </Reveal>
        <RevealStagger className="cadeo-adv-grid">
          {items.map((item, i) => {
            const Visual = ADV_VISUALS[i] ?? AdvVisualJourney;
            return (
              <RevealItem key={item.num}>
                <div className="cadeo-adv-item cadeo-adv-item--visual">
                  <Visual />
                  <div className="cadeo-adv-body">
                    <span className="cadeo-adv-num">{item.num}</span>
                    <AdvantageCopy title={item.title} desc={item.desc} />
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealStagger>
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  const features = [
    t("marketing.priceF1"),
    t("marketing.priceF2"),
    t("marketing.priceF3"),
    t("marketing.priceF4"),
    t("marketing.priceF5"),
    t("marketing.priceF6"),
    t("marketing.priceF7"),
    t("marketing.priceF8"),
  ];

  return (
    <section id="pricing" className="cadeo-section">
      <div className="cadeo-section-inner cadeo-pricing-section">
        <Reveal className="cadeo-section-head">
          <h2 className="cadeo-h2 text-center">{t("marketing.navPricing")}</h2>
          <p className="cadeo-sub mx-auto max-w-xl text-center">{t("marketing.pricingIncludes")}</p>
        </Reveal>
        <Reveal y={30}>
          <div className="cadeo-pricing-wrap cadeo-pricing-wrap--solo">
            <div className="cadeo-pricing-main">
              <div className="cadeo-pricing-header">
                <PricingPlans showTierName />
              </div>
              <div className="cadeo-pricing-features">
                {features.map((f) => (
                  <div key={f} className="cadeo-check">
                    {f === t("marketing.priceF1") ? (
                      <span className="cadeo-check-social">
                        <span>{f}</span>
                        <SocialIconRow size={14} />
                      </span>
                    ) : (
                      f
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
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
    <section id="faq" className="cadeo-section cadeo-faq-section">
      <div className="cadeo-faq-glow" />
      <div className="cadeo-section-inner">
        <Reveal className="cadeo-faq-header">
          <h2 className="cadeo-h2">{t("marketing.faqTitle")}</h2>
          <p className="cadeo-sub">
            <span className="cadeo-faq-highlight">{t("marketing.faqSub")}</span>
          </p>
        </Reveal>
        <RevealStagger className="cadeo-faq-list">
          {items.map((item, i) => (
            <RevealItem key={item.q}>
              <div className="cadeo-faq-item">
                <button
                  type="button"
                  className="cadeo-faq-btn"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  {item.q}
                  <span className="cadeo-faq-plus">{open === i ? "−" : "+"}</span>
                </button>
                {open === i && <div className="cadeo-faq-answer">{item.a}</div>}
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

function Footer() {
  const { t, locale } = useI18n();
  const colsRef = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);

  useLayoutEffect(() => {
    const cols = colsRef.current;
    if (!cols) return;

    const measure = () => {
      const gap = parseFloat(getComputedStyle(cols).columnGap) || 32;
      const colSlot = (cols.clientWidth - gap * 2) / 3;
      if (colSlot <= 0) return;

      let maxNeed = 0;
      const children = Array.from(cols.querySelectorAll<HTMLElement>(".cadeo-footer-col"));

      for (const col of children) {
        for (const el of col.querySelectorAll<HTMLElement>(".cadeo-footer-sticker, .cadeo-footer-links a")) {
          const prev = el.style.whiteSpace;
          el.style.whiteSpace = "nowrap";
          maxNeed = Math.max(maxNeed, el.scrollWidth);
          el.style.whiteSpace = prev;
        }
      }

      setStacked(maxNeed > colSlot + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cols);
    if (cols.parentElement) observer.observe(cols.parentElement);
    return () => observer.disconnect();
  }, [locale]);

  return (
    <footer className="cadeo-footer">
      <div className="cadeo-footer-box">
        <div className="cadeo-footer-top">
          <Logo />
          <div className="cadeo-footer-social" aria-hidden>
            <span className="cadeo-social-btn">
              <SocialIcon brand="facebook" size={14} />
            </span>
            <span className="cadeo-social-btn">
              <SocialIcon brand="instagram" size={14} />
            </span>
            <span className="cadeo-social-btn">
              <SocialIcon brand="tiktok" size={14} />
            </span>
          </div>
        </div>
        <div
          ref={colsRef}
          className={`cadeo-footer-cols${stacked ? " cadeo-footer-cols--stacked" : ""}`}
        >
          <div className="cadeo-footer-col">
            <span className="cadeo-footer-sticker">{t("marketing.footerSocial")}</span>
            <ul className="cadeo-footer-links">
              <li><a href="#how">{t("marketing.navHow")}</a></li>
              <li><a href="#pricing">{t("marketing.navPricing")}</a></li>
            </ul>
          </div>
          <div className="cadeo-footer-col">
            <span className="cadeo-footer-sticker cadeo-footer-sticker--2">{t("marketing.navFaq")}</span>
            <ul className="cadeo-footer-links">
              <li><a href="#faq">{t("marketing.navFaq")}</a></li>
              <li><Link href="/login">{t("marketing.navLogin")}</Link></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`}>Contact</a></li>
            </ul>
          </div>
          <div className="cadeo-footer-col">
            <span className="cadeo-footer-sticker">{t("marketing.footerLegal")}</span>
            <ul className="cadeo-footer-links">
              <li><Link href="/terms">{t("marketing.footerTerms")}</Link></li>
              <li><Link href="/privacy">{t("marketing.footerPrivacy")}</Link></li>
            </ul>
          </div>
        </div>
        <p className="cadeo-footer-copy">
          {t("marketing.footerRights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}

function CookieBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="cadeo-cookie">
      <p>
        {t("marketing.cookieText")}{" "}
        <Link href="/privacy" className="font-bold underline underline-offset-2">
          {t("marketing.footerPrivacy")}
        </Link>
      </p>
      <button type="button" className="cadeo-btn cadeo-btn-yellow !px-3 !py-1.5 !text-xs" onClick={() => setVisible(false)}>
        {t("marketing.cookieAccept")}
      </button>
    </div>
  );
}

export function LandingPage() {
  const authed = useIsAuthed();
  return (
    <div className="cadeo-page">
      <Nav authed={authed} />
      <main>
        <Hero authed={authed} />
        <HowItWorks />
        <WhatYouGet />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
