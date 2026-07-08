"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { pickWeightedPrize } from "@/lib/wheel";
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
import { computePreviewWheelSize } from "@/components/dashboard/JourneyPhonePreview";
import { resolveJourneyTheme } from "@/lib/journey-theme";
import {
  buildPublicStepOrder,
  isSocialFlowStep,
  journeyStepPosition,
  socialUrlForStep,
  type FlowActionStep,
  type PublicStep,
} from "@/lib/flow-steps";

interface PublicFlowProps {
  merchant: Merchant;
  prizes: Prize[];
  /** Dashboard preview: fully interactive but stubs all network + external links. */
  preview?: boolean;
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

export function PublicFlow({ merchant, prizes, preview = false }: PublicFlowProps) {
  const { t, locale } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const claimFormRef = useRef<HTMLFormElement>(null);
  const stepOrder = useMemo(
    () => buildPublicStepOrder(merchant, { preview }),
    [merchant, preview],
  );
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

  const theme = useMemo(() => resolveJourneyTheme(merchant), [merchant]);
  const accent = theme.accent;
  const spinLabel = merchant.spin_button_label?.trim() || t("public.spinButton");
  const previewWheelSize = useMemo(
    () => (preview ? computePreviewWheelSize() : 0),
    [preview],
  );
  const stepIndex = stepOrder.indexOf(step);
  const progress = ((stepIndex + 1) / stepOrder.length) * 100;
  const btnStyle = { backgroundColor: accent, color: theme.accentInk };
  const accentBtnStyle = {
    backgroundColor: "var(--pj-accent)",
    color: "var(--pj-accent-ink)",
  };
  const followedSocial = completedSteps.some(isSocialFlowStep);
  const googleReviewHref = merchant.google_review_link?.trim()
    ? `/api/google/review?slug=${encodeURIComponent(merchant.slug)}`
    : null;
  const stepPosition = useMemo(
    () => journeyStepPosition(stepOrder, step, { includeResult: preview }),
    [stepOrder, step, preview],
  );
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
    if (step === "claim") setLoading(false);
  }, [step]);

  useEffect(() => {
    if (!preview) return;
    const id = window.setTimeout(() => {
      window.dispatchEvent(new Event("pj-preview-resize"));
    }, 360);
    return () => window.clearTimeout(id);
  }, [step, preview]);

  const syncClaimField = (
    field: "claimFirstName" | "claimEmail" | "claimPhone",
    value: string,
  ) => {
    if (field === "claimFirstName") setClaimFirstName(value);
    if (field === "claimEmail") setClaimEmail(value);
    if (field === "claimPhone") setClaimPhone(value);
  };

  const readClaimForm = () => {
    const form = claimFormRef.current;
    const firstName =
      (form?.elements.namedItem("claimFirstName") as HTMLInputElement | null)?.value?.trim() ??
      claimFirstName.trim();
    const email =
      (form?.elements.namedItem("claimEmail") as HTMLInputElement | null)?.value?.trim() ??
      claimEmail.trim();
    const phone =
      (form?.elements.namedItem("claimPhone") as HTMLInputElement | null)?.value?.trim() ??
      claimPhone.trim();
    return { firstName, email, phone };
  };

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

  const jumpToPreviewStep = useCallback(
    (target: PublicStep) => {
      if (!preview) return;
      const targetIdx = stepOrder.indexOf(target);
      if (targetIdx < 0) return;

      const demoPrize = prizes[0] ?? null;
      const priorActions: FlowActionStep[] = [];
      for (let i = 0; i < targetIdx; i++) {
        const s = stepOrder[i];
        if (s !== "wheel" && s !== "claim" && s !== "result") priorActions.push(s);
      }

      setError(null);
      setLoading(false);
      setCompletedSteps(priorActions);
      setScreenshotUrl(priorActions.includes("google_review") ? "preview" : null);
      setReviewStatus(priorActions.includes("google_review") ? "verified" : "pending");
      setSpinning(false);
      setTargetPrizeId(undefined);
      setPreparedSpin(null);
      spinPrefetchStarted.current = false;
      setPrefetchingSpin(false);

      if (target === "claim" || target === "result") {
        setWonPrize(demoPrize);
        setSpinId("preview");
        setClaimFirstName("Alex");
        setClaimEmail("alex@example.com");
      } else {
        setWonPrize(null);
        setSpinId(null);
        setClaimFirstName("");
        setClaimEmail("");
        setClaimPhone("");
      }

      if (target === "result") {
        setPrizeCode("DEMO-2468");
        setRedemptionRules(null);
        setClaimEmailSent(false);
      } else {
        setPrizeCode(null);
        setRedemptionRules(null);
        setClaimEmailSent(false);
      }

      setStep(target);
      if (preview) {
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event("pj-preview-resize"));
        });
      }
    },
    [preview, stepOrder, prizes],
  );

  const handleSocialStep = (actionStep: FlowActionStep, url: string) => {
    if (!preview) window.open(url, "_blank", "noopener,noreferrer");
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
    if (preview) {
      const prize = pickWeightedPrize(prizes) ?? prizes[0];
      if (!prize) return null;
      const prepared = { spinId: "preview", prize };
      setPreparedSpin(prepared);
      return prepared;
    }
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
  }, [merchant.id, followedSocial, screenshotUrl, reviewStatus, completedSteps, locale, t, preview, prizes]);

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

  const submitClaim = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!spinId || !wonPrize) {
      setError(t("public.error"));
      return;
    }

    const { firstName, email, phone } = readClaimForm();
    setClaimFirstName(firstName);
    setClaimEmail(email);
    setClaimPhone(phone);

    if (preview) {
      setPrizeCode("DEMO-2468");
      setRedemptionRules(null);
      setClaimEmailSent(false);
      setStep("result");
      return;
    }

    if (!email) {
      setError(t("public.claimEmailRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("api.invalidEmail"));
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
          firstName: firstName || "Customer",
          email,
          phoneNumber: phone || undefined,
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
            <h2 className="public-heading mt-2 text-xl font-extrabold">
              {stepHeading}
            </h2>
            <p className="mt-1 text-sm font-medium text-muted">{t("public.reviewSubtitle")}</p>
          </div>

          {googleReviewHref ? (
            <a
              href={googleReviewHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (preview) e.preventDefault();
              }}
              className="public-btn public-touch-target flex w-full items-center justify-center gap-2"
              style={accentBtnStyle}
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
              if (preview) {
                advance("google_review");
                return;
              }
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
    const actionPosition = journeyStepPosition(stepOrder, actionStep, { includeResult: preview });
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
          <h2 className="public-heading mt-2 text-xl font-extrabold">
            {actionHeading}
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">{t(labelKey)}</p>
        </div>

        {url ? (
          <button
            type="button"
            onClick={() => handleSocialStep(actionStep, url)}
            className="public-btn public-touch-target flex items-center justify-center gap-2.5"
            style={accentBtnStyle}
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
    <div
      className={`public-flow w-full${preview ? " public-flow--preview" : ""}`}
      data-pj-theme={theme.id}
      style={theme.vars as React.CSSProperties}
    >
      <div className="pj-decor" aria-hidden>
        <span className="pj-orb pj-orb--1" />
        <span className="pj-orb pj-orb--2" />
        <span className="pj-orb pj-orb--3" />
        <span className="pj-spark pj-spark--1" />
        <span className="pj-spark pj-spark--2" />
        <span className="pj-spark pj-spark--3" />
        <span className="pj-spark pj-spark--4" />
        <span className="pj-spark pj-spark--5" />
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-col">
        <div className="mb-2 flex justify-end px-1">
          <LocaleSwitcher variant="journey" />
        </div>
        <MerchantHeader merchant={merchant} forceMobileLayout={preview} />

        <div className="mb-4 px-1">
          <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-muted">
            <span>{t("public.progress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="public-progress-track">
            <motion.div
              className="public-progress-fill"
              initial={false}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <StepIndicator
          current={step}
          steps={stepOrder}
          onStepClick={preview ? jumpToPreviewStep : undefined}
          showResult={preview}
          forceMobileLayout={preview}
        />

        <div className="public-card">
          {error && (
            <div className="brutal-alert-error rounded-none border-x-0 border-t-0" role="alert">
              {error}
            </div>
          )}

          <div className={preview ? "p-4" : "p-4 sm:p-6"}>
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
                  className={preview ? "space-y-4" : "public-wheel-step"}
                >
                  {preview ? (
                    <div className="text-center">
                      <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
                        {stepHeading}
                      </p>
                      <p className="public-heading mt-2 text-2xl font-extrabold leading-tight">
                        {spinLabel}
                      </p>
                      <p className="mt-1 text-sm font-medium text-muted">{t("public.wheelSubtitle")}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="public-wheel-emoji text-3xl" aria-hidden>
                        🎰
                      </p>
                      <h2 className="public-heading mt-2 text-xl font-extrabold">
                        {stepHeading}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-muted">{t("public.wheelSubtitle")}</p>
                    </div>
                  )}

                  <Wheel
                    prizes={prizes}
                    primaryColor={accent}
                    secondaryColor={merchant.secondary_color}
                    onSpinComplete={onSpinComplete}
                    spinning={spinning}
                    setSpinning={setSpinning}
                    targetPrizeId={targetPrizeId}
                    hideSpinButton
                    colors={theme.wheel}
                    sizePx={preview ? previewWheelSize : undefined}
                  />

                  {!spinning && !targetPrizeId && (
                    <button
                      type="button"
                      onClick={() => void handleSpinClick()}
                      disabled={prefetchingSpin || spinning}
                      className="public-btn public-touch-target w-full"
                      style={btnStyle}
                    >
                      {prefetchingSpin
                        ? t("public.spinPreparing")
                        : spinning
                          ? t("public.wheelSpinning")
                          : spinLabel}
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
                    <p className="public-heading mt-2 text-2xl font-extrabold leading-tight">
                      {wonPrize.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">{t("public.claimSubtitle")}</p>
                  </div>

                  <form
                    ref={claimFormRef}
                    className="space-y-4"
                    onSubmit={(event) => void submitClaim(event)}
                  >
                  <input
                    type="text"
                    name="claimFirstName"
                    autoComplete="given-name"
                    placeholder={t("public.claimFirstName")}
                    value={claimFirstName}
                    onChange={(e) => syncClaimField("claimFirstName", e.target.value)}
                    onInput={(e) => syncClaimField("claimFirstName", e.currentTarget.value)}
                    className="public-input font-semibold"
                  />
                  <input
                    type="email"
                    name="claimEmail"
                    autoComplete="email"
                    required={!preview}
                    placeholder={`${t("public.claimEmail")} *`}
                    value={claimEmail}
                    onChange={(e) => syncClaimField("claimEmail", e.target.value)}
                    onInput={(e) => syncClaimField("claimEmail", e.currentTarget.value)}
                    className="public-input font-semibold"
                  />
                  <input
                    type="tel"
                    name="claimPhone"
                    autoComplete="tel"
                    placeholder={t("public.claimPhoneOptional")}
                    value={claimPhone}
                    onChange={(e) => syncClaimField("claimPhone", e.target.value)}
                    onInput={(e) => syncClaimField("claimPhone", e.currentTarget.value)}
                    className="public-input text-center font-semibold"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="public-btn public-touch-target w-full"
                    style={accentBtnStyle}
                  >
                    {loading ? t("public.claimSending") : t("public.claimSubmit")}
                  </button>
                  </form>
                </motion.div>
              )}

              {step === "result" && wonPrize && prizeCode && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className={preview ? "public-result-step space-y-3" : "space-y-5 py-2"}
                >
                  <motion.p
                    className="text-center"
                    initial={{ scale: 0.4, rotate: -20 }}
                    animate={{ scale: 1, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.5 }}
                    aria-hidden
                  >
                    <span className="public-reward-emoji">🎉</span>
                  </motion.p>
                  <PrizeCoupon
                    prizeLabel={wonPrize.label}
                    prizeCode={prizeCode}
                    rules={redemptionRules}
                    compact={preview}
                    forceMobileLayout={preview}
                  />
                  {preview ? (
                    <p className="text-center text-xs font-medium leading-relaxed text-muted">
                      {claimEmailSent
                        ? t("public.codeSentEmail", { email: claimEmail })
                        : `${t("public.codeSentDev")} ${t("public.showScreen")}`}
                    </p>
                  ) : (
                    <>
                      <p className="text-center text-sm font-medium leading-relaxed text-muted">
                        {claimEmailSent
                          ? t("public.codeSentEmail", { email: claimEmail })
                          : t("public.codeSentDev")}
                      </p>
                      <p className="text-center text-sm font-medium leading-relaxed text-muted">
                        {t("public.showScreen")}
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
