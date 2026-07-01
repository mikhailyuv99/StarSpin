"use client";

import { createClient } from "@/lib/supabase/client";
import type { Spin } from "@/lib/types";
import { useRouter } from "next/navigation";

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
    return <p className="text-gray-500">Aucune capture pour le moment.</p>;
  }

  return (
    <div className="space-y-4">
      {spins.map((spin) => (
        <div key={spin.id} className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium">{spin.phone_number}</p>
              <p className="text-sm text-gray-500">
                {new Date(spin.created_at).toLocaleString("fr-FR")} ·{" "}
                <span
                  className={
                    spin.review_screenshot_status === "verified"
                      ? "text-green-600"
                      : spin.review_screenshot_status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }
                >
                  {spin.review_screenshot_status}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              {spin.review_screenshot_status !== "verified" && (
                <button
                  type="button"
                  onClick={() => updateStatus(spin.id, "verified")}
                  className="rounded border border-green-200 px-3 py-1 text-sm text-green-700"
                >
                  Valider
                </button>
              )}
              {spin.review_screenshot_status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => updateStatus(spin.id, "rejected")}
                  className="rounded border border-red-200 px-3 py-1 text-sm text-red-700"
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
              className="mt-3 inline-block text-sm text-orange-600 underline"
            >
              Voir la capture
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
