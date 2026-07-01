"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

  const bgStyle = {
    background: `linear-gradient(165deg, ${merchant.primary_color} 0%, ${merchant.secondary_color} 55%, #09090b 100%)`,
  };

  const btnPrimaryClass =
    "public-touch-target w-full rounded-sm font-bold text-white shadow-lg disabled:opacity-40 active:scale-[0.98] transition-transform";

  const btnOutlineClass =
    "public-touch-target w-full rounded-sm border-2 border-zinc-200 bg-white font-semibold text-zinc-900 active:bg-zinc-50 active:scale-[0.98] transition-transform";

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
    { key: "instagram", label: t("public.followInstagram"), emoji: "📸", url: merchant.social_links.instagram },
    { key: "facebook", label: t("public.followFacebook"), emoji: "👍", url: merchant.social_links.facebook },
    { key: "tiktok", label: t("public.followTiktok"), emoji: "🎵", url: merchant.social_links.tiktok },
  ].filter((l) => l.url);

  return (
    <div className="public-flow w-full" style={bgStyle}>
      <div className="mx-auto flex w-full max-w-lg flex-col">
        <div className="mb-2 flex justify-end px-1">
          <LocaleSwitcher variant="dark" />
        </div>
        <MerchantHeader merchant={merchant} />

        <div className="mb-4 px-1">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white/80">
            <span>{t("public.progress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <StepIndicator current={step} accent={accent} />

        <div className="overflow-hidden rounded-sm border border-white/30 bg-white shadow-2xl">
          {error && (
            <div
              className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm leading-snug text-red-800"
              role="alert"
            >
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
                    <h2 className="mt-2 text-xl font-bold text-zinc-900">{t("public.phoneTitle")}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{t("public.phoneSubtitle")}</p>
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
                      className={btnPrimaryClass}
                      style={{ backgroundColor: accent }}
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
                        <p className="text-center text-sm font-medium text-emerald-700">{otpHint}</p>
                      )}
                      <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={loading || otp.length < 4}
                        className={btnPrimaryClass}
                        style={{ backgroundColor: accent }}
                      >
                        {loading ? t("public.verifying") : t("public.verifyContinue")}
                      </button>
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={loading}
                        className="w-full text-center text-sm font-medium text-zinc-500 underline-offset-2 hover:underline"
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
                    <h2 className="mt-2 text-xl font-bold text-zinc-900">{t("public.socialTitle")}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{t("public.socialSubtitle")}</p>
                  </div>

                  <div className="space-y-2.5">
                    {socialLinks.map((link) => (
                      <button
                        key={link.key}
                        type="button"
                        onClick={() => handleSocialClick(link.url!)}
                        className={`${btnOutlineClass} flex items-center justify-center gap-2 text-left`}
                      >
                        <span className="text-xl">{link.emoji}</span>
                        {link.label}
                      </button>
                    ))}
                    {socialLinks.length === 0 && (
                      <p className="text-center text-sm text-zinc-500">{t("public.noSocial")}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("review")}
                    disabled={!followedSocial && socialLinks.length > 0}
                    className={btnPrimaryClass}
                    style={{ backgroundColor: accent }}
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
                    <h2 className="mt-2 text-xl font-bold text-zinc-900">{t("public.reviewTitle")}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{t("public.reviewSubtitle")}</p>
                  </div>

                  {merchant.google_review_link && (
                    <a
                      href={merchant.google_review_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnPrimaryClass} flex items-center justify-center gap-2`}
                      style={{ backgroundColor: "#18181b" }}
                    >
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
                    className={btnOutlineClass}
                  >
                    {loading ? t("public.uploadAnalyzing") : t("public.uploadScreenshot")}
                  </button>
                  <p className="text-center text-xs text-zinc-500">{t("public.reviewHint")}</p>
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
                    <h2 className="mt-2 text-xl font-bold text-zinc-900">{t("public.wheelTitle")}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{t("public.wheelSubtitle")}</p>
                  </div>

                  {activePrizes.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {activePrizes.map(({ prize }) => (
                        <span
                          key={prize.id}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700"
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
                      className={`${btnPrimaryClass} text-lg`}
                      style={{ backgroundColor: accent }}
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
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t("public.youWon")}</p>
                  <p className="text-balance text-2xl font-bold leading-tight text-zinc-900 sm:text-3xl">
                    {wonPrize.label}
                  </p>
                  <div className="rounded-sm border-2 border-dashed border-zinc-300 bg-gradient-to-b from-zinc-50 to-white px-4 py-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {t("public.checkoutCode")}
                    </p>
                    <p className="mt-3 font-mono text-4xl font-bold tracking-wider text-zinc-900">
                      {spinId?.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600">{t("public.showScreen")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
