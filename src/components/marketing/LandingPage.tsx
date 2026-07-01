"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo, StarspinMark } from "@/components/StarspinLogo";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { SocialIconRow } from "@/components/icons/SocialIconRow";
import { MarketingQrIcon, MarketingSpinWheel } from "@/components/marketing/MarketingSpinWheel";
import { PageScrollFallers } from "@/components/marketing/PageScrollFallers";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
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

function HeroWheelPhone() {
  return (
    <div className="cadeo-hero-phone" aria-hidden>
      <div className="cadeo-hero-phone-frame">
        <div className="cadeo-hero-phone-notch" />
        <div className="cadeo-hero-phone-screen">
          <p className="cadeo-hero-phone-label">Scan · Review · Spin</p>
          <div className="cadeo-hero-phone-wheel-wrap">
            <MarketingSpinWheel size={76} animate />
          </div>
          <div className="cadeo-hero-phone-cta">SPIN!</div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  const badges: { cls: string; brand: SocialBrand; text: string }[] = [
    { cls: "cadeo-stat-badge--white", brand: "google", text: "+351 Google reviews" },
    { cls: "cadeo-stat-badge--mint", brand: "tripadvisor", text: "+251 TripAdvisor" },
    { cls: "cadeo-stat-badge--yellow", brand: "tiktok", text: "+150 TikTok" },
    { cls: "cadeo-stat-badge--pink", brand: "instagram", text: "+251 Instagram" },
  ];

  return (
    <section className="cadeo-hero">
      <div className="cadeo-hero-inner">
        <Reveal className="cadeo-hero-copy" y={36}>
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
        </Reveal>

        <Reveal className="cadeo-hero-visual" y={40} delay={0.08}>
          <div className="cadeo-hero-scene">
            <div className="cadeo-hero-badges">
              {badges.map((b, i) => (
                <Reveal key={b.text} delay={0.12 + i * 0.06} y={20}>
                  <div className={`cadeo-stat-badge ${b.cls}`}>
                    <span className="cadeo-stat-badge-icon">
                      <SocialIcon brand={b.brand} size={18} />
                    </span>
                    <span>{b.text}</span>
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
            <HeroWheelPhone />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Pillars() {
  const { t } = useI18n();
  const items = [
    { cls: "cadeo-pillar--purple", num: "01", icon: "✨", text: t("marketing.pillar1") },
    { cls: "cadeo-pillar--pink", num: "02", icon: "🤝", text: t("marketing.pillar2") },
    { cls: "cadeo-pillar--blue", num: "03", icon: "📊", text: t("marketing.pillar3") },
    { cls: "cadeo-pillar--yellow", num: "04", icon: "🏆", text: t("marketing.pillar4") },
  ];

  return (
    <section className="cadeo-section cadeo-pillars-section">
      <div className="cadeo-section-inner">
        <Reveal className="cadeo-section-head">
          <p className="cadeo-section-eyebrow">{t("marketing.pillarsEyebrow")}</p>
          <h2 className="cadeo-h2 text-center">{t("marketing.pillarsTitle")}</h2>
        </Reveal>
        <RevealStagger className="cadeo-pillars-grid">
          {items.map((item) => (
            <RevealItem key={item.text} className="cadeo-pillar-item">
              <article className={`cadeo-pillar ${item.cls}`}>
                <div className="cadeo-pillar-top">
                  <span className="cadeo-pillar-level">LVL {item.num}</span>
                  <span className="cadeo-pillar-num">{item.num}</span>
                </div>
                <div className="cadeo-pillar-icon-game" aria-hidden>
                  {item.icon}
                </div>
                <div className="cadeo-pillar-xp" aria-hidden>
                  <div className="cadeo-pillar-xp-fill" style={{ width: `${Number(item.num) * 25}%` }} />
                </div>
                <p className="cadeo-pillar-text">{item.text}</p>
              </article>
            </RevealItem>
          ))}
        </RevealStagger>
        <Reveal className="cadeo-pillars-cta">
          <a href="#features" className="cadeo-btn cadeo-btn-yellow cadeo-btn-lg">
            {t("marketing.allFeatures")}
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function WheelFlyer() {
  return (
    <div className="cadeo-flyer-wrap">
      <div className="cadeo-card cadeo-flyer">
        <div className="cadeo-flyer-brand">
          <StarspinMark size={22} />
          <span className="cadeo-flyer-brand-name">STARSPIN</span>
        </div>
        <div className="cadeo-flyer-venue-strip">
          <span>YOUR VENUE</span>
          <span className="cadeo-flyer-venue-tag">SCAN ME</span>
        </div>
        <div className="cadeo-flyer-wheel-wrap">
          <MarketingSpinWheel size={168} />
          <div className="cadeo-flyer-qr">
            <MarketingQrIcon size={22} />
            <span>Scan to play</span>
          </div>
        </div>
        <div className="cadeo-flyer-steps">
          {[
            { n: "1", label: "Scan" },
            { n: "2", label: "Spin" },
            { n: "3", label: "Win" },
          ].map((step) => (
            <div key={step.label} className="cadeo-flyer-step">
              <span className="cadeo-flyer-step-num">{step.n}</span>
              <span>{step.label}</span>
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
      <div className="cadeo-phone-scene-inner">
        <div className="cadeo-phone">
          <div className="cadeo-phone-screen">
            <div className="cadeo-phone-screen-bg cadeo-phone-screen-bg--game" />
            <div className="cadeo-phone-notch" />
            <div className="cadeo-phone-screen-content">
              <p className="cadeo-phone-title">Play &amp; win a prize!</p>
              <div className="cadeo-phone-wheel-slot">
                <MarketingSpinWheel size={100} animate className="cadeo-phone-wheel-svg" />
              </div>
              <button type="button" className="cadeo-phone-play-btn">
                PLAY!
              </button>
            </div>
          </div>
        </div>
        <div className="cadeo-review-card">
          <span className="cadeo-review-badge">Step 1</span>
          <h4>{t("marketing.visit1Action")}</h4>
          <ol className="cadeo-review-steps">
            <li>Leave a Google review</li>
            <li>Come back to this page</li>
            <li>Spin the wheel</li>
          </ol>
          <div className="cadeo-review-btn">
            <span className="cadeo-review-btn-icon">
              <SocialIcon brand="google" size={14} />
            </span>
            Rate on Google
          </div>
        </div>
      </div>
    </div>
  );
}

function VisitsFlow() {
  const { t } = useI18n();
  const visits: { label: string; action: string; pill: string; brand: SocialBrand }[] = [
    { label: t("marketing.visit1"), action: t("marketing.visit1Action"), pill: "cadeo-visit-pill--google", brand: "google" },
    { label: t("marketing.visit2"), action: t("marketing.visit2Action"), pill: "cadeo-visit-pill--insta", brand: "instagram" },
    { label: t("marketing.visit3"), action: t("marketing.visit3Action"), pill: "cadeo-visit-pill--tiktok", brand: "tiktok" },
    { label: t("marketing.visit4"), action: t("marketing.visit4Action"), pill: "cadeo-visit-pill--facebook", brand: "facebook" },
  ];

  return (
    <div className="cadeo-visits-block">
      <RevealStagger className="cadeo-visits">
        {visits.map((v, i) => (
          <RevealItem key={v.label} className="cadeo-visit-item">
            <div className="cadeo-visit-card">
              <span className="cadeo-visit-step">{String(i + 1).padStart(2, "0")}</span>
              <p className="cadeo-visit-label">{v.label}</p>
              <div className="cadeo-visit-xp" aria-hidden>
                <div className="cadeo-visit-xp-fill" style={{ width: `${(i + 1) * 25}%` }} />
              </div>
              <span className={`cadeo-visit-pill ${v.pill}`}>
                <span className="cadeo-visit-pill-icon">
                  <SocialIcon brand={v.brand} size={26} />
                </span>
                <span className="cadeo-visit-pill-text">{v.action}</span>
              </span>
            </div>
          </RevealItem>
        ))}
      </RevealStagger>
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
          <div className="cadeo-win-screen-content">
            <p className="cadeo-win-title">YOU WON!<br />1 FREE DRINK</p>
            <div className="cadeo-form-field">First name</div>
            <div className="cadeo-form-field">Email</div>
            <div className="cadeo-form-field">Phone</div>
            <div className="cadeo-win-claim">Claim my prize</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GiftScene() {
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
      <div className="cadeo-gift-box">
        <span className="cadeo-gift-emoji" aria-hidden>
          🎁
        </span>
        <div className="cadeo-gift-wheel">
          <MarketingSpinWheel size={150} animate className="cadeo-gift-wheel-svg" />
        </div>
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
          <Reveal className="cadeo-feature-visual" y={32}>
            <WheelFlyer />
          </Reveal>
          <Reveal className="cadeo-feature-copy" delay={0.06}>
            <p className="cadeo-feature-label">{t("marketing.scanSubtitle")}</p>
            <h3 className="cadeo-feature-title">{t("marketing.scanTitle")}</h3>
            <p className="cadeo-feature-body">{t("marketing.scanBody")}</p>
          </Reveal>
        </div>

        <div className="cadeo-feature cadeo-feature--reverse">
          <Reveal className="cadeo-feature-visual" y={32}>
            <PhoneScene />
          </Reveal>
          <Reveal className="cadeo-feature-copy" delay={0.06}>
            <p className="cadeo-feature-label">{t("marketing.funSubtitle")}</p>
            <h3 className="cadeo-feature-title">{t("marketing.funTitle")}</h3>
            <p className="cadeo-feature-body">{t("marketing.funBody")}</p>
          </Reveal>
        </div>

        <div className="cadeo-visits-intro">
          <Reveal>
            <h3 className="cadeo-h2">{t("marketing.visitsTitle")}</h3>
            <p className="cadeo-sub mx-auto max-w-xl">{t("marketing.visitsBody")}</p>
          </Reveal>
          <VisitsFlow />
        </div>

        <Reveal className="cadeo-quote" y={28}>
          <div className="cadeo-quote-layout">
            <div className="cadeo-quote-photo">
              <Image
                src={marketingImages.blackBarbershopOwner}
                alt="Duc, owner of The Black Barbershop"
                fill
                sizes="(max-width: 768px) 90vw, 280px"
                unoptimized
                className="cadeo-quote-photo-img"
              />
            </div>
            <div className="cadeo-quote-content">
              <p className="cadeo-quote-title">{t("marketing.quote")}</p>
              <p className="cadeo-quote-body">{t("marketing.quoteBody")}</p>
              <div className="cadeo-quote-author">
                <div>
                  <p className="cadeo-quote-author-name">{t("marketing.quoteAuthor")}</p>
                  <p className="cadeo-quote-author-role">{t("marketing.quoteRole")}</p>
                </div>
              </div>
              <div className="cadeo-quote-btn">
                <Link href="/login" className="cadeo-btn cadeo-btn-yellow">
                  {t("marketing.footerDemo")}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="cadeo-feature">
          <Reveal className="cadeo-feature-visual" y={32}>
            <DataScene />
          </Reveal>
          <Reveal className="cadeo-feature-copy" delay={0.06}>
            <p className="cadeo-feature-label">CRM</p>
            <h3 className="cadeo-feature-title">{t("marketing.dataTitle")}</h3>
            <p className="cadeo-feature-body">{t("marketing.dataBody")}</p>
          </Reveal>
        </div>

        <div className="cadeo-feature cadeo-feature--reverse">
          <Reveal className="cadeo-feature-visual" y={32}>
            <GiftScene />
          </Reveal>
          <Reveal className="cadeo-feature-copy" delay={0.06}>
            <p className="cadeo-feature-label">{t("marketing.prizeSubtitle")}</p>
            <h3 className="cadeo-feature-title">{t("marketing.prizeTitle")}</h3>
            <p className="cadeo-feature-body">{t("marketing.prizeBody")}</p>
          </Reveal>
        </div>

        <Reveal className="text-center">
          <h3 className="cadeo-h2">{t("marketing.easyTitle")}</h3>
          <p className="cadeo-sub mx-auto max-w-lg">{t("marketing.easyBody")}</p>
        </Reveal>
      </div>
    </section>
  );
}

function Advantages() {
  const { t } = useI18n();
  const items = [
    { num: "01", text: t("marketing.adv1") },
    { num: "02", text: t("marketing.adv2") },
    { num: "03", text: t("marketing.adv3") },
    { num: "04", text: t("marketing.adv4") },
  ];

  return (
    <section className="cadeo-section cadeo-section--tight-top">
      <div className="cadeo-section-inner">
        <Reveal>
          <h2 className="cadeo-h2 text-center">{t("marketing.advantagesTitle")}</h2>
        </Reveal>
        <RevealStagger className="cadeo-adv-grid">
          {items.map((item) => (
            <RevealItem key={item.text}>
              <div className="cadeo-adv-item">
                <span className="cadeo-adv-num">{item.num}</span>
                <span>{item.text}</span>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
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
      <div className="cadeo-section-inner cadeo-pricing-section">
        <Reveal y={30}>
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
                <p className="cadeo-signup-banner">{t("marketing.signupBanner")}</p>
                <span className="cadeo-signup-badge">{t("marketing.signupBannerSub")}</span>
                <div className="mt-4">
                  <Link href="/login" className="cadeo-btn cadeo-btn-purple cadeo-btn-lg">
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
              <p className="cadeo-pricing-includes">{t("marketing.pricingIncludes")}</p>
              <div className="cadeo-pricing-features">
                {[...left, ...right].map((f) => (
                  <div key={f} className="cadeo-check">
                    {f === t("marketing.priceF2") ? (
                      <span className="cadeo-check-social">
                        <span>{t("marketing.priceF2")}</span>
                        <SocialIconRow size={16} />
                      </span>
                    ) : (
                      f
                    )}
                  </div>
                ))}
              </div>
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
  const { t } = useI18n();
  return (
    <footer className="cadeo-footer">
      <div className="cadeo-footer-box">
        <div className="cadeo-footer-top">
          <Logo />
          <div className="cadeo-footer-social">
            <a href="#" className="cadeo-social-btn" aria-label="Facebook">
              <SocialIcon brand="facebook" size={16} />
            </a>
            <a href="#" className="cadeo-social-btn" aria-label="Instagram">
              <SocialIcon brand="instagram" size={16} />
            </a>
            <a href="#" className="cadeo-social-btn" aria-label="TikTok">
              <SocialIcon brand="tiktok" size={16} />
            </a>
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
      <PageScrollFallers />
      <Nav />
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
