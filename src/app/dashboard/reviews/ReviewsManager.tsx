"use client";

import { createClient } from "@/lib/supabase/client";
import { reviewScreenshotHref } from "@/lib/review-screenshot";
import type { Spin } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useI18n } from "@/i18n/client";
import { localeToIntl } from "@/i18n/config";

export function ReviewsManager({ spins }: { spins: Spin[] }) {
 const router = useRouter();
 const { t, locale } = useI18n();
 const intl = localeToIntl(locale);

 const updateStatus = async (id: string, status: "verified" | "rejected") => {
 const supabase = createClient();
 await supabase
 .from("spins")
 .update({ review_screenshot_status: status })
 .eq("id", id);
 router.refresh();
 };

 if (spins.length === 0) {
 return <p className={ui.muted}>{t("dashboard.noScreenshots")}</p>;
 }

 return (
 <div className="space-y-4">
 {spins.map((spin) => (
 <div key={spin.id} className="overflow-hidden rounded-[14px] border-2 border-black bg-white">
 <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
 <div className="min-w-0 space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <span
 className={`inline-flex rounded-md border-2 border-black px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
 spin.review_screenshot_status === "verified"
 ? "bg-emerald-100"
 : spin.review_screenshot_status === "rejected"
 ? "bg-red-100"
 : "bg-amber-100"
 }`}
 >
 {spin.review_screenshot_status}
 </span>
 <span className="font-mono text-xs text-muted">
 {new Date(spin.created_at).toLocaleString(intl)}
 </span>
 </div>

 <div className="grid gap-1 text-sm">
 {spin.claim_first_name && (
 <p>
 <span className="font-bold text-ink">{t("public.claimFirstName")}:</span>{" "}
 {spin.claim_first_name}
 </p>
 )}
 {spin.claim_email && (
 <p>
 <span className="font-bold text-ink">{t("common.email")}:</span> {spin.claim_email}
 </p>
 )}
 {spin.prize_code && (
 <p className="font-mono text-sm font-extrabold text-ink">
 {t("dashboard.reviewsPrizeCode")}: {spin.prize_code}
 </p>
 )}
 {spin.prize?.label && (
 <p>
 <span className="font-bold text-ink">{t("dashboard.label")}:</span> {spin.prize.label}
 </p>
 )}
 </div>
 </div>

 <div className="flex shrink-0 flex-wrap gap-2">
 {spin.review_screenshot_status !== "verified" && (
 <button
 type="button"
 onClick={() => updateStatus(spin.id, "verified")}
 className={ui.btnSuccess}
 >
 {t("dashboard.approve")}
 </button>
 )}
 {spin.review_screenshot_status !== "rejected" && (
 <button
 type="button"
 onClick={() => updateStatus(spin.id, "rejected")}
 className={ui.btnDanger}
 >
 {t("dashboard.reject")}
 </button>
 )}
 </div>
 </div>

 {spin.review_screenshot_url && (
 <div className="border-t-2 border-black/10 bg-[#fafafa] p-4">
 <a
 href={reviewScreenshotHref(spin.review_screenshot_url)}
 target="_blank"
 rel="noopener noreferrer"
 className="group block"
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={reviewScreenshotHref(spin.review_screenshot_url)}
 alt={t("dashboard.viewScreenshot")}
 className="mx-auto max-h-80 w-full max-w-md rounded-lg border-2 border-black object-contain transition group-hover:-translate-y-0.5"
 />
 </a>
 <p className="mt-2 text-center text-xs font-semibold text-muted">
 {t("dashboard.viewScreenshot")} · {t("dashboard.reviewsFraudHint")}
 </p>
 </div>
 )}
 </div>
 ))}
 </div>
 );
}
