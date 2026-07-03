"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { contrastTextColor } from "@/lib/wheel";
import type { Merchant, Prize } from "@/lib/types";
import { StepIndicator } from "@/components/StepIndicator";
import { MerchantHeader } from "@/components/MerchantHeader";
import { Wheel } from "@/components/Wheel";
import { verifyReviewScreenshot } from "@/lib/ocr";
import { useI18n } from "@/i18n/client";
import { localeHeaders } from "@/lib/locale-headers";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { PrizeCoupon } from "@/components/PrizeCoupon";
import type { RedemptionRulesSnapshot } from "@/lib/redemption-rules";
import {
  buildPublicStepOrder,
  isSocialFlowStep,
  journeyStepPosition,
  socialUrlForStep,
  type FlowActionStep,
  type PublicStep,
} from "@/lib/flow-steps";
import { pickGoogleReviewOpenUrl } from "@/lib/google-place-id";

interface PublicFlowProps {
  merchant: Merchant;
  prizes: Prize[];
}

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

function socialBrandForStep(step: FlowActionStep): SocialBrand {
  return step === "google_review" ? "google" : step;
}

export function PublicFlow({ merchant, prizes }: PublicFlowProps) {
  const { t, locale } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepOrder = useMemo(() => buildPublicStepOrder(merchant), [merchant]);
  const [step, setStep] = useState<PublicStep>(stepOrder[0]);
  const [completedSteps, setCompletedSteps] = useState<FlowActionStep[]>([]);
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
  const [preparedSpin, setPreparedSpin] = useState<{ spinId: string; prize: Prize } | null>(null);
  const [prefetchingSpin, setPrefetchingSpin] = useState(false);
  const spinPrefetchStarted = useRef(false);

  const accent = merchant.primary_color;
  const stepIndex = stepOrder.indexOf(step);
  const progress = ((stepIndex + 1) / stepOrder.length) * 100;
  const btnStyle = { backgroundColor: accent, color: contrastTextColor(accent) };
  const followedSocial = completedSteps.some(isSocialFlowStep);
  const googleReviewUrl = useMemo(
    () => pickGoogleReviewOpenUrl(merchant.google_review_link, merchant.google_place_id),
    [merchant.google_review_link, merchant.google_place_id],
  );
  const stepPosition = useMemo(() => journeyStepPosition(stepOrder, step), [stepOrder, step]);
  const stepHeading = t("public.journeyStepHeading", {
    current: stepPosition.current,
    total: stepPosition.total,
  });

  useEffect(() => {
    if (!stepOrder.includes(step)) {
      setStep(stepOrder[0]);
    }
  }, [step, stepOrder]);

  useEffect(() => {
    if (step === "result" && wonPrize) fireConfetti(accent);
  }, [step, wonPrize, accent]);

  const advance = useCallback(
    (completed?: FlowActionStep) => {
      const nextCompleted = completed ? [...completedSteps, completed] : completedSteps;
      if (completed) setCompletedSteps(nextCompleted);

      const currentIdx = stepOrder.indexOf(step);
      const next = stepOrder[currentIdx + 1];
      if (next) setStep(next);
    },
    [completedSteps, step, stepOrder],
  );

  const handleSocialStep = (actionStep: FlowActionStep, url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    advance(actionStep);
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
      setScreenshotUrl(uploadData.path ?? uploadData.url);
      advance("google_review");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("public.error"));
    } finally {
      setLoading(false);
    }
  };

  const prepareSpin = useCallback(async (): Promise<{ spinId: string; prize: Prize } | null> => {
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
          completedFlowSteps: completedSteps,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("public.error"));
      const prepared = { spinId: data.spinId as string, prize: data.prize as Prize };
      setPreparedSpin(prepared);
      return prepared;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("public.error"));
      return null;
    }
  }, [merchant.id, followedSocial, screenshotUrl, reviewStatus, completedSteps, locale, t]);

  useEffect(() => {
    if (step !== "wheel" || preparedSpin || spinPrefetchStarted.current) return;
    spinPrefetchStarted.current = true;
    setPrefetchingSpin(true);
    void prepareSpin().finally(() => setPrefetchingSpin(false));
  }, [step, preparedSpin, prepareSpin]);

  const handleSpinClick = useCallback(async () => {
    if (spinning || targetPrizeId) return;

    let ready = preparedSpin;
    if (!ready) {
      setPrefetchingSpin(true);
      ready = await prepareSpin();
      setPrefetchingSpin(false);
      if (!ready) return;
    }

    setSpinId(ready.spinId);
    setTargetPrizeId(ready.prize.id);
  }, [spinning, targetPrizeId, preparedSpin, prepareSpin]);

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
      if (data.prizeCode) {
        setPrizeCode(data.prizeCode);
        setRedemptionRules(data.redemptionRules ?? null);
        setClaimEmailSent(Boolean(data.emailSent));
        setStep("result");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? t("public.error"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("public.error"));
    } finally {
      setLoading(false);
    }
  };

  const renderActionStep = (actionStep: FlowActionStep) => {
    if (actionStep === "google_review") {
      return (
        <motion.div
          key="google_review"
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
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-ink">
              {stepHeading}
            </h2>
            <p className="mt-1 text-sm font-medium text-muted">{t("public.reviewSubtitle")}</p>
          </div>

          {googleReviewUrl ? (
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="public-btn public-touch-target flex w-full items-center justify-center gap-2"
              style={{ backgroundColor: "var(--c-yellow)", color: "#0a0a0a" }}
            >
              <SocialIcon brand="google" size={20} />
              {t("public.openGoogle")}
            </a>
          ) : (
            <p className="text-center text-sm font-semibold text-muted">{t("public.reviewLinkUnavailable")}</p>
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
      );
    }

    const url = socialUrlForStep(actionStep, merchant.social_links);
    const brand = socialBrandForStep(actionStep);
    const labelKey = `public.follow_${actionStep}` as const;
    const actionPosition = journeyStepPosition(stepOrder, actionStep);
    const actionHeading = t("public.journeyStepHeading", {
      current: actionPosition.current,
      total: actionPosition.total,
    });

    return (
      <motion.div
        key={actionStep}
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
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-ink">
            {actionHeading}
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">{t(labelKey)}</p>
        </div>

        {url ? (
          <button
            type="button"
            onClick={() => handleSocialStep(actionStep, url)}
            className="public-btn public-btn-outline public-touch-target flex items-center justify-center gap-2.5"
          >
            <span className="public-social-icon-box">
              <SocialIcon brand={brand} size={22} />
            </span>
            {t(labelKey)}
          </button>
        ) : (
          <p className="text-center text-sm font-medium text-muted">{t("public.stepNotConfigured")}</p>
        )}
      </motion.div>
    );
  };

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
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <StepIndicator current={step} steps={stepOrder} accent={accent} />

        <div className="public-card">
          {error && (
            <div className="brutal-alert-error rounded-none border-x-0 border-t-0" role="alert">
              {error}
            </div>
          )}

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {step !== "wheel" && step !== "claim" && step !== "result" && renderActionStep(step)}

              {step === "wheel" && (
                <motion.div
                  key="wheel"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="public-wheel-stage"
                >
                  <div className="text-center">
                    <p className="text-3xl" aria-hidden>
                      🎰
                    </p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-ink">
                      {stepHeading}
                    </h2>
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
                      onClick={() => void handleSpinClick()}
                      disabled={prefetchingSpin || spinning}
                      className="public-btn public-touch-target text-lg"
                      style={btnStyle}
                    >
                      {prefetchingSpin
                        ? t("public.spinPreparing")
                        : spinning
                          ? t("public.wheelSpinning")
                          : t("public.spinButton")}
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
                    <p className="text-xs font-extrabold uppercase tracking-widest text-muted">{stepHeading}</p>
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
