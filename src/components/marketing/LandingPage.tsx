"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { marketingImages } from "@/lib/marketing-images";
import "./cadeo-styles.css";

function Logo() {
  return <StarspinLogo href="/" variant="light" size="md" />;
}

function Nav() {
  const { t } = useI18n();
  return (
    <div className="cadeo-nav-wrap">
      <nav className="cadeo-nav">
        <Logo />
        <div className="cadeo-nav-links">
          <a href="#features">{t("marketing.navFeatures")}</a>
          <a href="#pricing">{t("marketing.navPricing")}</a>
          <a href="#faq">{t("marketing.navFaq")}</a>
        </div>
        <div className="cadeo-nav-actions">
          <LocaleSwitcher variant="brutal" />
          <Link href="/login" className="cadeo-btn cadeo-btn-yellow !hidden sm:!inline-flex">
            {t("marketing.footerDemo")}
          </Link>
        </div>
      </nav>
    </div>
  );
}

function TrustBar() {
  const { t } = useI18n();
  return (
    <div className="cadeo-trust">
      <span>{t("marketing.trustedBy")}</span>
      <span className="cadeo-trust-rating">
        Google <span className="cadeo-trust-stars">★★★★★</span> 4.9
      </span>
      <span className="cadeo-trust-rating">
        Trustpilot <span className="cadeo-trust-stars">★★★★★</span> 4.8
      </span>
    </div>
  );
}

function HeroWheelPhone() {
  return (
    <div className="cadeo-hero-phone" aria-hidden>
      <div className="cadeo-hero-phone-frame">
        <div className="cadeo-hero-phone-notch" />
        <div className="cadeo-hero-phone-screen">
          <p className="cadeo-hero-phone-label">Scan · Review · Spin</p>
          <div
            className="cadeo-hero-phone-wheel"
            style={{
              background:
                "conic-gradient(from -30deg, #f5e08e 0deg 72deg, #9b7fe8 72deg 144deg, #f48fb1 144deg 216deg, #a8e6cf 216deg 288deg, #b8cfe8 288deg 360deg)",
            }}
          >
            <div className="cadeo-hero-phone-wheel-hub" />
          </div>
          <div className="cadeo-hero-phone-cta">SPIN!</div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  const badges = [
    { cls: "cadeo-stat-badge--white", icon: "G", text: "+351 Google reviews" },
    { cls: "cadeo-stat-badge--mint", icon: "★", text: "+251 TripAdvisor" },
    { cls: "cadeo-stat-badge--yellow", icon: "♪", text: "+150 TikTok" },
    { cls: "cadeo-stat-badge--pink", icon: "◎", text: "+251 Instagram" },
  ];

  return (
    <section className="cadeo-hero">
      <div className="cadeo-hero-inner">
        <div className="cadeo-hero-copy">
          <p className="cadeo-hero-eyebrow">
            <span className="cadeo-hero-eyebrow-star" aria-hidden>
              ★
            </span>
            {t("marketing.heroEyebrow")}
          </p>
          <h1>
            <span className="cadeo-hero-line">{t("marketing.heroTitle")}</span>
            <span className="cadeo-hero-accent">{t("marketing.heroTitleAccent")}</span>
          </h1>
          <p className="cadeo-hero-lead">{t("marketing.heroSubtitle")}</p>
          <p className="cadeo-sub cadeo-hero-body">{t("marketing.heroBody")}</p>
          <div className="cadeo-hero-actions">
            <Link href="/login" className="cadeo-btn cadeo-btn-yellow cadeo-btn-lg">
              ✨ {t("marketing.magicRecipe")}
            </Link>
            <a href="#pricing" className="cadeo-btn cadeo-btn-outline cadeo-btn-lg">
              {t("marketing.heroDemo")}
            </a>
          </div>
          <div className="cadeo-hero-mini-trust">
            <span className="cadeo-hero-mini-trust-stars">★★★★★</span>
            <span>{t("marketing.heroProof")}</span>
          </div>
        </div>

        <div className="cadeo-hero-visual">
          <div className="cadeo-hero-glow" />
          <div className="cadeo-hero-scene">
            <div className="cadeo-hero-badges">
              {badges.map((b) => (
                <div key={b.text} className={`cadeo-stat-badge ${b.cls}`}>
                  <span className="cadeo-stat-badge-icon">{b.icon}</span>
                  <span>{b.text}</span>
                </div>
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
            <HeroWheelPhone />
          </div>
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const { t } = useI18n();
  const items = [
    { cls: "cadeo-pillar--purple", icon: "⭐", text: t("marketing.pillar1") },
    { cls: "cadeo-pillar--pink", icon: "🤝", text: t("marketing.pillar2") },
    { cls: "cadeo-pillar--blue", icon: "👤", text: t("marketing.pillar3") },
    { cls: "cadeo-pillar--yellow", icon: "🎁", text: t("marketing.pillar4") },
  ];

  return (
    <section className="cadeo-section">
      <div className="cadeo-section-inner">
        <h2 className="cadeo-h2 text-center">{t("marketing.pillarsTitle")}</h2>
        <div className="cadeo-pillars-grid">
          {items.map((item) => (
            <div key={item.text} className={`cadeo-pillar ${item.cls}`}>
              <div className="cadeo-pillar-icon">{item.icon}</div>
              <p className="cadeo-pillar-text">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="cadeo-pillars-cta">
          <a href="#features" className="cadeo-btn cadeo-btn-yellow cadeo-btn-lg">
            {t("marketing.allFeatures")}
          </a>
        </div>
      </div>
    </section>
  );
}

function WheelFlyer() {
  return (
    <div className="cadeo-flyer-wrap">
      <div className="cadeo-card cadeo-flyer">
        <div className="cadeo-flyer-logo">LOGO</div>
        <div
          className="cadeo-flyer-wheel"
          style={{
            background:
              "conic-gradient(from 0deg, #fff 0deg 60deg, #0a0a0a 60deg 120deg, #fff 120deg 180deg, #0a0a0a 180deg 240deg, #fff 240deg 300deg, #0a0a0a 300deg 360deg)",
          }}
        >
          <div className="cadeo-flyer-qr">
            <div style={{ fontSize: "1.5rem" }}>▦</div>
            Scan to play
          </div>
        </div>
        <div className="cadeo-flyer-steps">
          {["📱 SCAN", "🎰 SPIN", "🎁 WIN"].map((s) => (
            <div key={s} className="cadeo-flyer-step">
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneScene() {
  const { t } = useI18n();
  return (
    <div className="cadeo-phone-scene">
      <div className="cadeo-phone">
        <div className="cadeo-phone-screen relative flex flex-col">
          <div className="cadeo-phone-notch" />
          <p className="text-center text-[0.55rem] font-extrabold uppercase leading-tight mt-4 px-1">
            Play our game &amp; win a prize!
          </p>
          <div className="mt-auto mb-8 px-2">
            <div className="h-16 rounded-full border-2 border-black bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300" />
            <button type="button" className="mt-2 w-full rounded-full border-2 border-black bg-purple-500 py-1 text-[0.55rem] font-extrabold text-white">
              PLAY!
            </button>
          </div>
        </div>
      </div>
      <div className="cadeo-review-card">
        <h4>{t("marketing.visit1Action")}</h4>
        <p className="cadeo-review-step">1. Leave a Google review</p>
        <p className="cadeo-review-step">2. Come back to this page</p>
        <p className="cadeo-review-step">3. Spin the wheel</p>
        <div className="cadeo-review-btn">Rate on Google ★ 4.9</div>
      </div>
    </div>
  );
}

function VisitsFlow() {
  const { t } = useI18n();
  const visits = [
    { label: t("marketing.visit1"), action: t("marketing.visit1Action"), pill: "cadeo-visit-pill--google", icon: "G" },
    { label: t("marketing.visit2"), action: t("marketing.visit2Action"), pill: "cadeo-visit-pill--insta", icon: "◎" },
    { label: t("marketing.visit3"), action: t("marketing.visit3Action"), pill: "cadeo-visit-pill--tiktok", icon: "♪" },
    { label: t("marketing.visit4"), action: t("marketing.visit4Action"), pill: "cadeo-visit-pill--facebook", icon: "f" },
  ];

  return (
    <div className="cadeo-visits">
      {visits.map((v) => (
        <div key={v.label} className="cadeo-visit-card">
          <p className="cadeo-visit-label">{v.label}</p>
          <span className={`cadeo-visit-pill ${v.pill}`}>
            <span className="font-black">{v.icon}</span>
            {v.action}
          </span>
          <span className="cadeo-visit-arrow" aria-hidden>↷</span>
        </div>
      ))}
    </div>
  );
}

function DataScene() {
  return (
    <div className="cadeo-data-scene">
      <div className="cadeo-poll-card cadeo-poll-card--1">How was the welcome?</div>
      <div className="cadeo-poll-card cadeo-poll-card--2">Rate our service</div>
      <div className="cadeo-poll-card cadeo-poll-card--3">Your opinion matters</div>
      <div className="cadeo-win-phone">
        <div className="cadeo-win-screen">
          <p className="cadeo-win-title">YOU WON! 🎉<br />1 FREE DRINK</p>
          <div className="cadeo-form-field">First name</div>
          <div className="cadeo-form-field">Last name</div>
          <div className="cadeo-form-field">Email</div>
          <div className="cadeo-form-field">Phone</div>
          <div className="mt-2 rounded-lg border-2 border-black bg-yellow-200 py-1 text-center text-[0.55rem] font-extrabold">
            Claim my prize
          </div>
        </div>
      </div>
    </div>
  );
}

function GiftScene() {
  const { t } = useI18n();
  const tags = [
    { cls: "cadeo-gift-tag--purple", text: "Redeem on next visit" },
    { cls: "cadeo-gift-tag--white", text: "Valid 1 month" },
    { cls: "cadeo-gift-tag--yellow", text: "Min. spend $5" },
    { cls: "cadeo-gift-tag--pink", text: "In-store only" },
  ];

  return (
    <div className="cadeo-gift-scene">
      {tags.map((tag) => (
        <div key={tag.text} className={`cadeo-gift-tag ${tag.cls}`}>
          {tag.text}
        </div>
      ))}
      <div className="cadeo-gift-box" title={t("marketing.prizeTitle")}>
        🎁
      </div>
    </div>
  );
}

function Features() {
  const { t } = useI18n();

  return (
    <section id="features" className="cadeo-section">
      <div className="cadeo-section-inner">
        <div className="cadeo-feature">
          <div className="cadeo-feature-visual">
            <WheelFlyer />
          </div>
          <div>
            <p className="cadeo-feature-label">{t("marketing.scanSubtitle")}</p>
            <h3 className="cadeo-feature-title">{t("marketing.scanTitle")}</h3>
            <p className="cadeo-feature-body">{t("marketing.scanBody")}</p>
          </div>
        </div>

        <div className="cadeo-feature cadeo-feature--reverse">
          <div className="cadeo-feature-visual">
            <PhoneScene />
          </div>
          <div>
            <p className="cadeo-feature-label">{t("marketing.funSubtitle")}</p>
            <h3 className="cadeo-feature-title">{t("marketing.funTitle")}</h3>
            <p className="cadeo-feature-body">{t("marketing.funBody")}</p>
          </div>
        </div>

        <div className="text-center" style={{ marginBottom: "2rem" }}>
          <h3 className="cadeo-h2">{t("marketing.visitsTitle")}</h3>
          <p className="cadeo-sub mx-auto max-w-xl">{t("marketing.visitsBody")}</p>
          <VisitsFlow />
        </div>

        <div className="cadeo-quote">
          <p className="cadeo-quote-title">{t("marketing.quote")}</p>
          <p className="mt-4 text-sm leading-relaxed opacity-85">{t("marketing.quoteBody")}</p>
          <div className="cadeo-quote-author">
            <div className="cadeo-quote-avatar">🍟</div>
            <div>
              <p className="text-sm font-extrabold">{t("marketing.quoteAuthor")}</p>
              <p className="text-xs font-semibold opacity-60">Marketing Manager</p>
            </div>
          </div>
          <div className="cadeo-quote-btn">
            <Link href="/login" className="cadeo-btn cadeo-btn-yellow">
              {t("marketing.footerDemo")}
            </Link>
          </div>
        </div>

        <div className="cadeo-feature">
          <div className="cadeo-feature-visual">
            <DataScene />
          </div>
          <div>
            <p className="cadeo-feature-label">CRM</p>
            <h3 className="cadeo-feature-title">{t("marketing.dataTitle")}</h3>
            <p className="cadeo-feature-body">{t("marketing.dataBody")}</p>
          </div>
        </div>

        <div className="cadeo-feature cadeo-feature--reverse">
          <div className="cadeo-feature-visual">
            <GiftScene />
          </div>
          <div>
            <p className="cadeo-feature-label">🎁</p>
            <h3 className="cadeo-feature-title">{t("marketing.prizeTitle")}</h3>
            <p className="cadeo-feature-body">{t("marketing.prizeBody")}</p>
          </div>
        </div>

        <div className="text-center">
          <h3 className="cadeo-h2">{t("marketing.easyTitle")}</h3>
          <p className="cadeo-sub mx-auto max-w-lg">{t("marketing.easyBody")}</p>
        </div>
      </div>
    </section>
  );
}

function Advantages() {
  const { t } = useI18n();
  const items = [
    { icon: "👥", text: t("marketing.adv1") },
    { icon: "📚", text: t("marketing.adv2") },
    { icon: "🎯", text: t("marketing.adv3") },
    { icon: "💬", text: t("marketing.adv4") },
  ];

  return (
    <section className="cadeo-section" style={{ paddingTop: 0 }}>
      <div className="cadeo-section-inner">
        <h2 className="cadeo-h2 text-center">{t("marketing.advantagesTitle")}</h2>
        <div className="cadeo-adv-grid">
          {items.map((item) => (
            <div key={item.text} className="cadeo-adv-item">
              <span className="cadeo-adv-icon">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
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
  const sideAdv = [t("marketing.adv1"), t("marketing.adv2"), t("marketing.adv3"), t("marketing.adv4")];

  return (
    <section id="pricing" className="cadeo-section">
      <div className="cadeo-section-inner" style={{ maxWidth: "56rem" }}>
        <div className="cadeo-pricing-wrap">
          <div className="cadeo-pricing-inner">
            <div className="cadeo-pricing-side">
              <h3>{t("marketing.advantagesTitle")}</h3>
              <ul>
                {sideAdv.map((a) => (
                  <li key={a}>
                    <span>🎯</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
              <div className="cadeo-signup-box">
                <p className="text-sm font-extrabold">{t("marketing.signupBanner")}</p>
                <span className="cadeo-signup-badge">{t("marketing.signupBannerSub")}</span>
                <div className="mt-4">
                  <Link href="/login" className="cadeo-btn cadeo-btn-purple">
                    {t("marketing.navCta")}
                  </Link>
                </div>
              </div>
            </div>
            <div className="cadeo-pricing-main">
              <div className="cadeo-pricing-header">
                <h3 className="cadeo-pricing-name">{t("marketing.pricingName")}</h3>
                <div>
                  <span className="cadeo-pricing-price">{t("marketing.pricingPrice")}</span>
                  <span className="cadeo-pricing-period"> {t("marketing.pricingPeriod")}</span>
                </div>
              </div>
              <p className="text-xs font-extrabold uppercase tracking-widest opacity-50 mb-4">
                {t("marketing.pricingIncludes")}
              </p>
              <div className="cadeo-pricing-features">
                {[...left, ...right].map((f) => (
                  <div key={f} className="cadeo-check">
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
    <section id="faq" className="cadeo-section cadeo-faq-section">
      <div className="cadeo-faq-glow" />
      <span className="cadeo-faq-mascot" aria-hidden>☕</span>
      <div className="cadeo-section-inner">
        <div className="cadeo-faq-header">
          <h2 className="cadeo-h2">{t("marketing.faqTitle")}</h2>
          <p className="cadeo-sub">
            <span className="cadeo-faq-highlight">{t("marketing.faqSub")}</span>
          </p>
        </div>
        <div className="cadeo-faq-list">
          {items.map((item, i) => (
            <div key={item.q} className="cadeo-faq-item">
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
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="cadeo-footer">
      <div className="cadeo-footer-box">
        <div className="cadeo-footer-top">
          <Logo />
          <div className="cadeo-footer-social">
            <a href="#" className="cadeo-social-btn" aria-label="Facebook">f</a>
            <a href="#" className="cadeo-social-btn" aria-label="Instagram">◎</a>
            <a href="#" className="cadeo-social-btn" aria-label="LinkedIn">in</a>
          </div>
        </div>
        <div className="cadeo-footer-cols">
          <div>
            <span className="cadeo-footer-sticker">{t("marketing.footerSocial")}</span>
            <ul className="cadeo-footer-links">
              <li><Link href="/login">{t("marketing.footerDemo")}</Link></li>
              <li><a href="#pricing">{t("marketing.navPricing")}</a></li>
            </ul>
          </div>
          <div>
            <span className="cadeo-footer-sticker cadeo-footer-sticker--2">{t("marketing.navFaq")}</span>
            <ul className="cadeo-footer-links">
              <li><Link href="/login">{t("marketing.navLogin")}</Link></li>
              <li><a href="mailto:hello@starspin.com">Contact</a></li>
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
      <p>{t("marketing.cookieText")}</p>
      <button type="button" className="cadeo-btn cadeo-btn-yellow !px-3 !py-1.5 !text-xs" onClick={() => setVisible(false)}>
        {t("marketing.cookieAccept")}
      </button>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="cadeo-page">
      <Nav />
      <TrustBar />
      <main>
        <Hero />
        <Pillars />
        <Features />
        <Advantages />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
