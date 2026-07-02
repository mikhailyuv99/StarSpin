"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { contrastTextColor } from "@/lib/wheel";
import type { Merchant, Prize, PublicStep } from "@/lib/types";
import { StepIndicator } from "@/components/StepIndicator";
import { MerchantHeader } from "@/components/MerchantHeader";
import { Wheel } from "@/components/Wheel";
import { verifyReviewScreenshot } from "@/lib/ocr";
import { useI18n } from "@/i18n/client";
import { localeHeaders } from "@/lib/locale-headers";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { PrizeCoupon } from "@/components/PrizeCoupon";
import type { RedemptionRulesSnapshot } from "@/lib/redemption-rules";

interface PublicFlowProps {
  merchant: Merchant;
  prizes: Prize[];
}

const STEP_ORDER: PublicStep[] = ["social", "review", "wheel", "claim", "result"];

const stepVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

function fireConfetti(accent: string) {
  import("canvas-confetti").then(({ default: confetti }) => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.65 },
      colors: [accent, "#fff", "#fbbf24", "#34d399"],
    });
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: [accent, "#fff"] });
      confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: [accent, "#fff"] });
    }, 280);
  });
}

export function PublicFlow({ merchant, prizes }: PublicFlowProps) {
  const { t, locale } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<PublicStep>("social");
  const [followedSocial, setFollowedSocial] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"pending" | "verified" | "rejected">("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [spinId, setSpinId] = useState<string | null>(null);
  const [prizeCode, setPrizeCode] = useState<string | null>(null);
  const [redemptionRules, setRedemptionRules] = useState<RedemptionRulesSnapshot | null>(null);
  const [claimEmailSent, setClaimEmailSent] = useState(false);
  const [claimFirstName, setClaimFirstName] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [targetPrizeId, setTargetPrizeId] = useState<string | undefined>();

  const accent = merchant.primary_color;
  const progress = ((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100;

  const btnStyle = { backgroundColor: accent, color: contrastTextColor(accent) };

  useEffect(() => {
    if (step === "result" && wonPrize) fireConfetti(accent);
  }, [step, wonPrize, accent]);

  const handleSocialClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setFollowedSocial(true);
  };

  const handleReviewUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const status = await verifyReviewScreenshot(file, merchant.name);
      setReviewStatus(status);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("merchantId", merchant.id);
      const uploadRes = await fetch("/api/review/upload", {
        method: "POST",
        headers: { "x-locale": locale },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? t("api.uploadFailed"));
      setScreenshotUrl(uploadData.url);
      setStep("wheel");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("public.error"));
    } finally {
      setLoading(false);
    }
  };

  const executeSpin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: localeHeaders(locale),
        body: JSON.stringify({
          merchantId: merchant.id,
          followedSocial,
          reviewScreenshotUrl: screenshotUrl,
          reviewScreenshotStatus: reviewStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("public.error"));
      setTargetPrizeId(data.prize.id);
      setSpinId(data.spinId);
      return data.prize as Prize;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("public.error"));
      return null;
    } finally {
      setLoading(false);
    }
  }, [merchant.id, followedSocial, screenshotUrl, reviewStatus, locale, t]);

  const onSpinComplete = (prize: Prize) => {
    setWonPrize(prize);
    setStep("claim");
  };

  const submitClaim = async () => {
    if (!spinId || !wonPrize) return;
    if (!claimEmail.trim()) {
      setError(t("public.claimEmailRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spin/claim", {
        method: "POST",
        headers: localeHeaders(locale),
        body: JSON.stringify({
          spinId,
          firstName: claimFirstName,
          email: claimEmail,
          phoneNumber: claimPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("public.error"));
      setPrizeCode(data.prizeCode);
      setRedemptionRules(data.redemptionRules ?? null);
      setClaimEmailSent(Boolean(data.emailSent));
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("public.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleWheelSpin = async () => {
    await executeSpin();
  };

  const socialLinks = [
    { key: "instagram" as SocialBrand, label: t("public.followInstagram"), url: merchant.social_links.instagram },
    { key: "facebook" as SocialBrand, label: t("public.followFacebook"), url: merchant.social_links.facebook },
    { key: "tiktok" as SocialBrand, label: t("public.followTiktok"), url: merchant.social_links.tiktok },
  ].filter((l) => l.url) as { key: SocialBrand; label: string; url: string }[];

  return (
    <div className="public-flow w-full">
      <div className="mx-auto flex w-full max-w-lg flex-col">
        <div className="mb-2 flex justify-end px-1">
          <LocaleSwitcher variant="brutal" />
        </div>
        <MerchantHeader merchant={merchant} />

        <div className="mb-4 px-1">
          <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-muted">
            <span>{t("public.progress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="public-progress-track">
            <motion.div
              className="public-progress-fill"
              style={{ backgroundColor: accent }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <StepIndicator current={step} accent={accent} />

        <div className="public-card">
          {error && (
            <div className="brutal-alert-error rounded-none border-x-0 border-t-0" role="alert">
              {error}
            </div>
          )}

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {step === "social" && (
                <motion.div
                  key="social"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <p className="text-3xl" aria-hidden>
                      ⭐
                    </p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-ink">{t("public.socialTitle")}</h2>
                    <p className="mt-1 text-sm font-medium text-muted">{t("public.socialSubtitle")}</p>
                  </div>

                  <div className="space-y-2.5">
                    {socialLinks.map((link) => (
                      <button
                        key={link.key}
                        type="button"
                        onClick={() => handleSocialClick(link.url!)}
                      className={`public-btn public-btn-outline public-touch-target flex items-center justify-center gap-2.5 text-left`}
                      >
                        <span className="public-social-icon-box">
                          <SocialIcon brand={link.key} size={22} />
                        </span>
                        {link.label}
                      </button>
                    ))}
                    {socialLinks.length === 0 && (
                      <p className="text-center text-sm font-medium text-muted">{t("public.noSocial")}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("review")}
                    disabled={!followedSocial && socialLinks.length > 0}
                    className="public-btn public-touch-target"
                    style={btnStyle}
                  >
                    {t("public.missionDone")}
                  </button>
                </motion.div>
              )}

              {step === "review" && (
                <motion.div
                  key="review"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <p className="text-3xl" aria-hidden>
                      🏆
                    </p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-ink">{t("public.reviewTitle")}</h2>
                    <p className="mt-1 text-sm font-medium text-muted">{t("public.reviewSubtitle")}</p>
                  </div>

                  {merchant.google_review_link && (
                    <a
                      href={merchant.google_review_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-btn public-touch-target flex items-center justify-center gap-2"
                      style={{ backgroundColor: "var(--c-yellow)", color: "#0a0a0a" }}
                    >
                      <SocialIcon brand="google" size={20} />
                      {t("public.openGoogle")}
                    </a>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,.heic"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReviewUpload(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = fileInputRef.current;
                      if (!input) return;
                      input.value = "";
                      input.click();
                    }}
                    disabled={loading}
                    className="public-btn public-btn-outline public-touch-target"
                  >
                    {loading ? t("public.uploadAnalyzing") : t("public.uploadScreenshot")}
                  </button>
                  <p className="text-center text-xs font-medium text-muted">{t("public.reviewHint")}</p>
                </motion.div>
              )}

              {step === "wheel" && (
                <motion.div
                  key="wheel"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <p className="text-3xl" aria-hidden>
                      🎰
                    </p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-ink">{t("public.wheelTitle")}</h2>
                    <p className="mt-1 text-sm font-medium text-muted">{t("public.wheelSubtitle")}</p>
                  </div>

                  <Wheel
                    prizes={prizes}
                    primaryColor={merchant.primary_color}
                    secondaryColor={merchant.secondary_color}
                    onSpinComplete={onSpinComplete}
                    spinning={spinning}
                    setSpinning={setSpinning}
                    targetPrizeId={targetPrizeId}
                    hideSpinButton
                  />

                  {!spinning && !targetPrizeId && (
                    <button
                      type="button"
                      onClick={handleWheelSpin}
                      disabled={loading}
                      className="public-btn public-touch-target text-lg"
                      style={btnStyle}
                    >
                      {loading ? t("public.spinPreparing") : t("public.spinButton")}
                    </button>
                  )}
                </motion.div>
              )}

              {step === "claim" && wonPrize && (
                <motion.div
                  key="claim"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-muted">{t("public.claimTitle")}</p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase leading-tight text-ink">
                      {wonPrize.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">{t("public.claimSubtitle")}</p>
                  </div>

                  <input
                    type="text"
                    autoComplete="given-name"
                    placeholder={t("public.claimFirstName")}
                    value={claimFirstName}
                    onChange={(e) => setClaimFirstName(e.target.value)}
                    className="public-input font-semibold"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={`${t("public.claimEmail")} *`}
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    className="public-input font-semibold"
                  />
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder={t("public.claimPhoneOptional")}
                    value={claimPhone}
                    onChange={(e) => setClaimPhone(e.target.value)}
                    className="public-input text-center font-semibold"
                  />

                  <button
                    type="button"
                    onClick={submitClaim}
                    disabled={loading || claimFirstName.trim().length < 2 || !claimEmail.trim()}
                    className="public-btn public-touch-target"
                    style={{ backgroundColor: "var(--c-yellow)", color: "#0a0a0a" }}
                  >
                    {loading ? t("public.claimSending") : t("public.claimSubmit")}
                  </button>
                </motion.div>
              )}

              {step === "result" && wonPrize && prizeCode && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="space-y-5 py-2"
                >
                  <motion.p
                    className="text-center text-5xl"
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ repeat: 2, duration: 0.4 }}
                    aria-hidden
                  >
                    🎉
                  </motion.p>
                  <PrizeCoupon
                    prizeLabel={wonPrize.label}
                    prizeCode={prizeCode}
                    rules={redemptionRules}
                  />
                  <p className="text-center text-sm font-medium leading-relaxed text-muted">
                    {claimEmailSent
                      ? t("public.codeSentEmail", { email: claimEmail })
                      : t("public.codeSentDev")}
                  </p>
                  <p className="text-center text-sm font-medium leading-relaxed text-muted">{t("public.showScreen")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
