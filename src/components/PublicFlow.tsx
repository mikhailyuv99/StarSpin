"use client";

import { useCallback, useRef, useState } from "react";
import type { Merchant, Prize, PublicStep } from "@/lib/types";
import { StepIndicator } from "@/components/StepIndicator";
import { MerchantHeader } from "@/components/MerchantHeader";
import { Wheel } from "@/components/Wheel";
import { verifyReviewScreenshot } from "@/lib/ocr";

interface PublicFlowProps {
  merchant: Merchant;
  prizes: Prize[];
}

export function PublicFlow({ merchant, prizes }: PublicFlowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<PublicStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
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

  const bgStyle = {
    background: `linear-gradient(160deg, ${merchant.primary_color} 0%, ${merchant.secondary_color} 100%)`,
  };

  const btnPrimaryClass =
    "public-touch-target w-full rounded-sm font-semibold text-white disabled:opacity-40 active:scale-[0.99] transition-transform";

  const btnOutlineClass =
    "public-touch-target w-full rounded-sm border border-zinc-300 bg-white font-semibold text-zinc-900 active:bg-zinc-50";

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId: merchant.id, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      if (data.devCode) {
        setOtp(data.devCode);
        setOtpHint(`Code de test : ${data.devCode}`);
      } else {
        setOtpHint("Code envoyé par SMS.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId: merchant.id, phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setPhoneVerified(true);
      setPhone(data.phoneNumber);
      setStep("social");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
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
      const uploadRes = await fetch("/api/review/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload échoué");
      setScreenshotUrl(uploadData.url);
      setStep("wheel");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: merchant.id,
          phoneNumber: phone,
          followedSocial,
          reviewScreenshotUrl: screenshotUrl,
          reviewScreenshotStatus: reviewStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setTargetPrizeId(data.prize.id);
      setSpinId(data.spinId);
      return data.prize as Prize;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      return null;
    } finally {
      setLoading(false);
    }
  }, [merchant.id, phone, followedSocial, screenshotUrl, reviewStatus]);

  const onSpinComplete = (prize: Prize) => {
    setWonPrize(prize);
    setStep("result");
  };

  const handleWheelSpin = async () => {
    const prize = await executeSpin();
    if (prize) setTargetPrizeId(prize.id);
  };

  return (
    <div className="public-flow w-full" style={bgStyle}>
      <div className="mx-auto flex w-full max-w-lg flex-col">
        <MerchantHeader merchant={merchant} />
        <StepIndicator current={step} accent={accent} />

        <div className="rounded-sm border border-white/25 bg-white p-4 shadow-2xl sm:p-6">
          {error && (
            <div
              className="mb-4 rounded-sm border border-red-200 bg-red-50 px-3 py-3 text-sm leading-snug text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Vérification téléphone</h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">Vérification par SMS</p>
              </div>
              {!phoneVerified ? (
                <>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    placeholder="0xx xxx xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="public-input"
                  />
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading || !phone}
                    className={btnPrimaryClass}
                    style={{ backgroundColor: accent }}
                  >
                    {loading ? "Envoi…" : "Recevoir le code"}
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    enterKeyHint="done"
                    placeholder="Code à 6 chiffres"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="public-input text-center font-mono text-lg tracking-[0.2em]"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={loading || otp.length < 4}
                    className="public-touch-target w-full rounded-sm border border-zinc-900 bg-zinc-900 font-semibold text-white disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-500"
                  >
                    Vérifier
                  </button>
                  {otpHint && (
                    <p className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-3 text-center font-mono text-base leading-snug text-zinc-900">
                      {otpHint}
                    </p>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep("social")}
                  className={btnPrimaryClass}
                  style={{ backgroundColor: accent }}
                >
                  Continuer
                </button>
              )}
            </div>
          )}

          {step === "social" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Réseaux sociaux</h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  Touchez un réseau, suivez la page, puis revenez ici.
                </p>
              </div>
              <div className="space-y-2.5">
                {merchant.social_links.instagram && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.instagram!)}
                    className={btnOutlineClass}
                  >
                    Suivre sur Instagram
                  </button>
                )}
                {merchant.social_links.facebook && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.facebook!)}
                    className={btnOutlineClass}
                  >
                    Suivre sur Facebook
                  </button>
                )}
                {merchant.social_links.tiktok && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.tiktok!)}
                    className={btnOutlineClass}
                  >
                    Suivre sur TikTok
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep("review")}
                disabled={!followedSocial}
                className={btnPrimaryClass}
                style={{ backgroundColor: accent }}
              >
                J&apos;ai suivi — continuer
              </button>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Avis Google</h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  Laissez un avis, faites une capture d&apos;écran, puis uploadez-la.
                </p>
              </div>
              {merchant.google_review_link && (
                <a
                  href={merchant.google_review_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-touch-target flex w-full items-center justify-center rounded-sm border border-zinc-900 bg-zinc-900 font-semibold text-white"
                >
                  Ouvrir Google Avis
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
                {loading ? "Analyse en cours…" : "Choisir une capture d'écran"}
              </button>
            </div>
          )}

          {step === "wheel" && (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-semibold text-zinc-900">Roue de la fortune</h2>
              {!spinning && !targetPrizeId ? (
                <button
                  type="button"
                  onClick={handleWheelSpin}
                  disabled={loading}
                  className={`${btnPrimaryClass} max-w-none`}
                  style={{ backgroundColor: accent }}
                >
                  {loading ? "Préparation…" : "Lancer le tirage"}
                </button>
              ) : (
                <Wheel
                  prizes={prizes}
                  primaryColor={merchant.primary_color}
                  secondaryColor={merchant.secondary_color}
                  onSpinComplete={onSpinComplete}
                  spinning={spinning}
                  setSpinning={setSpinning}
                  targetPrizeId={targetPrizeId}
                />
              )}
            </div>
          )}

          {step === "result" && wonPrize && (
            <div className="space-y-5 py-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Félicitations
              </p>
              <p className="text-balance text-2xl font-semibold leading-tight text-zinc-900">
                {wonPrize.label}
              </p>
              <div className="rounded-sm border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Code à montrer en caisse
                </p>
                <p className="mt-3 font-mono text-3xl font-bold tracking-wider text-zinc-900 sm:text-4xl">
                  {spinId?.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-zinc-600">
                Gardez cet écran ouvert pour récupérer votre prix.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
