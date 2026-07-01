"use client";

import { createClient } from "@/lib/supabase/client";
import type { Spin } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";

export function ReviewsManager({ spins }: { spins: Spin[] }) {
  const router = useRouter();

  const updateStatus = async (id: string, status: "verified" | "rejected") => {
    const supabase = createClient();
    await supabase
      .from("spins")
      .update({ review_screenshot_status: status })
      .eq("id", id);
    router.refresh();
  };

  if (spins.length === 0) {
    return <p className={ui.muted}>Aucune capture pour le moment.</p>;
  }

  return (
    <div className="divide-y divide-border border border-border">
      {spins.map((spin) => (
        <div key={spin.id} className="bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm text-ink">{spin.phone_number}</p>
              <p className="mt-1 text-xs text-muted">
                {new Date(spin.created_at).toLocaleString("fr-FR")} ·{" "}
                <span className="uppercase tracking-wide">{spin.review_screenshot_status}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {spin.review_screenshot_status !== "verified" && (
                <button
                  type="button"
                  onClick={() => updateStatus(spin.id, "verified")}
                  className={ui.btnSuccess}
                >
                  Valider
                </button>
              )}
              {spin.review_screenshot_status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => updateStatus(spin.id, "rejected")}
                  className={ui.btnDanger}
                >
                  Rejeter
                </button>
              )}
            </div>
          </div>
          {spin.review_screenshot_url && (
            <a
              href={spin.review_screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 inline-block text-sm ${ui.link}`}
            >
              Voir la capture
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
