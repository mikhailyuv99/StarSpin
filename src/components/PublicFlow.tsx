"use client";

import { useCallback, useState } from "react";
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

  const bgStyle = {
    background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color})`,
  };

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
      if (data.devCode) setOtp(data.devCode);
      setStep("phone");
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

      const uploadRes = await fetch("/api/review/upload", {
        method: "POST",
        body: formData,
      });
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
    if (prize) {
      setTargetPrizeId(prize.id);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8" style={bgStyle}>
      <div className="mx-auto max-w-md">
        <MerchantHeader merchant={merchant} />
        <StepIndicator current={step} />

        <div className="rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Vérification téléphone</h2>
              <p className="text-sm text-gray-600">
                Un numéro = un spin tous les 30 jours par commerce.
              </p>
              {!phoneVerified ? (
                <>
                  <input
                    type="tel"
                    placeholder="0xx xxx xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border px-4 py-3"
                  />
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading || !phone}
                    className="w-full rounded-lg py-3 font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: merchant.primary_color }}
                  >
                    Recevoir le code SMS
                  </button>
                  <input
                    type="text"
                    placeholder="Code OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-lg border px-4 py-3"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={loading || !otp}
                    className="w-full rounded-lg border-2 py-3 font-semibold"
                    style={{ borderColor: merchant.primary_color, color: merchant.primary_color }}
                  >
                    Vérifier le code
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep("social")}
                  className="w-full rounded-lg py-3 font-semibold text-white"
                  style={{ backgroundColor: merchant.primary_color }}
                >
                  Continuer
                </button>
              )}
            </div>
          )}

          {step === "social" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Suivez-nous</h2>
              <p className="text-sm text-gray-600">
                Cliquez sur un réseau social puis revenez ici.
              </p>
              <div className="flex flex-col gap-3">
                {merchant.social_links.instagram && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.instagram!)}
                    className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-semibold text-white"
                  >
                    Instagram
                  </button>
                )}
                {merchant.social_links.facebook && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.facebook!)}
                    className="rounded-lg bg-blue-600 py-3 font-semibold text-white"
                  >
                    Facebook
                  </button>
                )}
                {merchant.social_links.tiktok && (
                  <button
                    type="button"
                    onClick={() => handleSocialClick(merchant.social_links.tiktok!)}
                    className="rounded-lg bg-black py-3 font-semibold text-white"
                  >
                    TikTok
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep("review")}
                disabled={!followedSocial}
                className="w-full rounded-lg py-3 font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: merchant.primary_color }}
              >
                J&apos;ai suivi — continuer
              </button>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Laisser un avis Google</h2>
              {merchant.google_review_link && (
                <a
                  href={merchant.google_review_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-green-600 py-3 text-center font-semibold text-white"
                >
                  Ouvrir Google Avis
                </a>
              )}
              <p className="text-sm text-gray-600">
                Puis uploadez une capture d&apos;écran de votre avis publié.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReviewUpload(file);
                }}
                className="w-full text-sm"
              />
              {loading && <p className="text-sm text-gray-500">Analyse en cours...</p>}
            </div>
          )}

          {step === "wheel" && (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-semibold">Tournez la roue !</h2>
              {!spinning && !targetPrizeId ? (
                <button
                  type="button"
                  onClick={handleWheelSpin}
                  disabled={loading}
                  className="mx-auto block rounded-full px-8 py-3 font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: merchant.primary_color }}
                >
                  {loading ? "Préparation..." : "Lancer le tirage"}
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
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold">Félicitations !</h2>
              <p className="text-lg">{wonPrize.label}</p>
              <div className="rounded-lg bg-gray-100 px-4 py-3">
                <p className="text-sm text-gray-600">Code à montrer en caisse</p>
                <p className="font-mono text-lg font-bold">{spinId?.slice(0, 8).toUpperCase()}</p>
              </div>
              <p className="text-xs text-gray-500">
                Conservez cet écran pour récupérer votre prix.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
