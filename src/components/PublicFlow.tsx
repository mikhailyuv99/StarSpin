"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import type { Merchant, Prize, PublicStep } from "@/lib/types";
import { StepIndicator } from "@/components/StepIndicator";
import { MerchantHeader } from "@/components/MerchantHeader";
import { Wheel } from "@/components/Wheel";
import { verifyReviewScreenshot } from "@/lib/ocr";
import { prizeSliceAngles } from "@/lib/wheel";
import { useI18n } from "@/i18n/client";
import { localeHeaders } from "@/lib/locale-headers";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

interface PublicFlowProps {
  merchant: Merchant;
  prizes: Prize[];
}

const STEP_ORDER: PublicStep[] = ["phone", "social", "review", "wheel", "result"];

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
  const [step, setStep] = useState<PublicStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [followedSocial, setFollowedSocial] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"pending" | "verified" | "rejected">("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [spinId, setSpinId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [targetPrizeId, setTargetPrizeId] = useState<string | undefined>();
  const [otpHint, setOtpHint] = useState<string | null>(null);

  const accent = merchant.primary_color;
  const activePrizes = prizeSliceAngles(prizes);
  const progress = ((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100;

  const btnStyle = { backgroundColor: accent, color: "#fff" };

  useEffect(() => {
    if (step === "result" && wonPrize) fireConfetti(accent);
  }, [step, wonPrize, accent]);

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: localeHeaders(locale),
        body: JSON.stringify({ merchantId: merchant.id, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("public.error"));
      setOtpSent(true);
      if (data.devCode) {
        setOtp(data.devCode);
        setOtpHint(t("public.otpTestCode", { code: data.devCode }));
      } else {
        setOtpHint(t("public.otpSent"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("public.error"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: localeHeaders(locale),
        body: JSON.stringify({ merchantId: merchant.id, phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("public.error"));
      setPhone(data.phoneNumber);
      setStep("social");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("public.error"));
    } finally {
      setLoading(false);
    }
  };

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
          phoneNumber: phone,
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
  }, [merchant.id, phone, followedSocial, screenshotUrl, reviewStatus, locale, t]);

  const onSpinComplete = (prize: Prize) => {
    setWonPrize(prize);
    setStep("result");
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
              {step === "phone" && (
                <motion.div
                  key="phone"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <p className="text-3xl" aria-hidden>
                      🎯
                    </p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-ink">
                      {t("public.phoneTitle")}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">{t("public.phoneSubtitle")}</p>
                  </div>

                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    placeholder={t("public.phonePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="public-input text-center text-lg font-semibold"
                  />

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading || phone.length < 8}
                      className="public-btn public-touch-target"
                      style={btnStyle}
                    >
                      {loading ? t("public.sending") : t("public.sendCode")}
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        enterKeyHint="done"
                        placeholder={t("public.otpPlaceholder")}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="public-input text-center font-mono text-2xl tracking-[0.35em]"
                      />
                      {otpHint && (
                        <p className="text-center text-sm font-semibold text-muted">{otpHint}</p>
                      )}
                      <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={loading || otp.length < 4}
                        className="public-btn public-touch-target"
                        style={btnStyle}
                      >
                        {loading ? t("public.verifying") : t("public.verifyContinue")}
                      </button>
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={loading}
                        className="brutal-btn-ghost w-full text-center text-sm"
                      >
                        {t("public.resendCode")}
                      </button>
                    </>
                  )}
                </motion.div>
              )}

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
                      className={`public-btn public-btn-outline public-touch-target flex items-center justify-center gap-2 text-left`}
                      >
                        <SocialIcon brand={link.key} size={20} />
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
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReviewUpload(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
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

                  {activePrizes.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {activePrizes.map(({ prize }) => (
                        <span
                          key={prize.id}
                          className="public-prize-chip"
                        >
                          {prize.label}
                        </span>
                      ))}
                    </div>
                  )}

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

              {step === "result" && wonPrize && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="space-y-5 py-2 text-center"
                >
                  <motion.p
                    className="text-5xl"
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ repeat: 2, duration: 0.4 }}
                    aria-hidden
                  >
                    🎉
                  </motion.p>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-muted">{t("public.youWon")}</p>
                  <p className="text-balance font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase leading-tight text-ink sm:text-3xl">
                    {wonPrize.label}
                  </p>
                  <div className="brutal-card border-dashed bg-[var(--c-cream)] px-4 py-6">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
                      {t("public.checkoutCode")}
                    </p>
                    <p className="mt-3 font-mono text-4xl font-extrabold tracking-wider text-ink">
                      {spinId?.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-muted">{t("public.showScreen")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
