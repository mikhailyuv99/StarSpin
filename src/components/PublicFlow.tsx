"use client";

import { useCallback, useState } from "react";
import type { Merchant, Prize, PublicStep } from "@/lib/types";
import { StepIndicator } from "@/components/StepIndicator";
import { MerchantHeader } from "@/components/MerchantHeader";
import { Wheel } from "@/components/Wheel";
import { verifyReviewScreenshot } from "@/lib/ocr";

const inputClass =
  "w-full rounded-sm border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

interface PublicFlowProps {
  merchant: Merchant;
  prizes: Prize[];
}

export function PublicFlow({ merchant, prizes }: PublicFlowProps) {
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

  const btnPrimary = (disabled?: boolean) =>
    `w-full rounded-sm py-2.5 text-sm font-semibold text-white disabled:opacity-40 ${disabled ? "" : ""}`;

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
        setOtpHint(`Code de test (SMS non activé) : ${data.devCode}`);
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
    <div className="min-h-screen px-4 py-10" style={bgStyle}>
      <div className="mx-auto max-w-md">
        <MerchantHeader merchant={merchant} />
        <StepIndicator current={step} accent={accent} />

        <div className="rounded-sm border border-white/20 bg-white p-6 shadow-2xl">
          {error && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Vérification téléphone</h2>
                <p className="mt-1 text-sm text-zinc-500">Un numéro · un spin / 30 jours</p>
              </div>
              {!phoneVerified ? (
                <>
                  <input
                    type="tel"
                    placeholder="0xx xxx xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading || !phone}
                    className={btnPrimary()}
                    style={{ backgroundColor: accent }}
                  >
                    Recevoir le code
                  </button>
                  <input
                    type="text"
                    placeholder="Code OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={loading || !otp}
                    className="w-full rounded-sm border border-zinc-900 bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-500"
                  >
                    Vérifier
                  </button>
                  {otpHint && (
                    <p className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2 text-center font-mono text-sm text-zinc-800">
                      {otpHint}
                    </p>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep("social")}
                  className={btnPrimary()}
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
                <h2 className="text-base font-semibold text-zinc-900">Réseaux sociaux</h2>
                <p className="mt-1 text-sm text-zinc-500">Ouvrez un lien puis revenez ici.</p>
              </div>
              <div className="space-y-2">
                {merchant.social_links.instagram && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.instagram!)}
                    className="w-full rounded-sm border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Instagram
                  </button>
                )}
                {merchant.social_links.facebook && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.facebook!)}
                    className="w-full rounded-sm border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Facebook
                  </button>
                )}
                {merchant.social_links.tiktok && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.tiktok!)}
                    className="w-full rounded-sm border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    TikTok
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep("review")}
                disabled={!followedSocial}
                className={btnPrimary(!followedSocial)}
                style={{ backgroundColor: accent }}
              >
                Continuer
              </button>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Avis Google</h2>
                <p className="mt-1 text-sm text-zinc-500">Publiez un avis puis uploadez une capture.</p>
              </div>
              {merchant.google_review_link && (
                <a
                  href={merchant.google_review_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-sm border border-zinc-900 bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Ouvrir Google Avis
                </a>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReviewUpload(file);
                }}
                className="w-full text-sm text-zinc-600 file:mr-3 file:rounded-sm file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
              {loading && <p className="text-sm text-zinc-500">Analyse en cours…</p>}
            </div>
          )}

          {step === "wheel" && (
            <div className="space-y-4">
              <h2 className="text-center text-base font-semibold text-zinc-900">Roue de la fortune</h2>
              {!spinning && !targetPrizeId ? (
                <button
                  type="button"
                  onClick={handleWheelSpin}
                  disabled={loading}
                  className="mx-auto block rounded-sm px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
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
            <div className="space-y-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Félicitations
              </p>
              <p className="text-xl font-semibold text-zinc-900">{wonPrize.label}</p>
              <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Code caisse
                </p>
                <p className="mt-2 font-mono text-lg font-semibold text-zinc-900">
                  {spinId?.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <p className="text-xs text-zinc-500">Conservez cet écran pour récupérer votre prix.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
