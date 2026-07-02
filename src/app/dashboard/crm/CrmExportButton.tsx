"use client";

import type { CrmContact } from "@/lib/crm";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

export function CrmExportButton({ contacts }: { contacts: CrmContact[] }) {
  const t = useTranslations();

  const exportCsv = () => {
    const header = ["email", "first_name", "phone", "spins", "last_spin", "prizes"];
    const rows = contacts.map((c) => [
      c.email,
      c.firstName ?? "",
      c.phone ?? "",
      String(c.spinCount),
      c.lastSpinAt,
      c.prizes.join("; "),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `starspin-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={contacts.length === 0}
      className={`${ui.btnOutline} !w-auto px-5`}
    >
      {t("dashboard.crmExport")}
    </button>
  );
}
