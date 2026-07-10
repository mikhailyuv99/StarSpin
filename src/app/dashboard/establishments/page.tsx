import { getCurrentMerchant, getOwnerMerchants } from "@/lib/merchant";
import {
  canAddEstablishment,
  getMerchantAccount,
  isAccountLive,
  isMultiBusinessAccount,
} from "@/lib/merchant-account";
import { redirect } from "next/navigation";
import { getTranslations } from "@/i18n/server";
import { ui } from "@/components/ui/styles";
import { EstablishmentList } from "./EstablishmentList";
import { AddEstablishmentForm } from "./AddEstablishmentForm";
import { MultiBusinessSubscribeCard } from "./MultiBusinessSubscribeCard";

export default async function EstablishmentsPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");

  const establishments = await getOwnerMerchants();
  const account = await getMerchantAccount();
  const t = await getTranslations();

  const canAdd = canAddEstablishment(account, establishments.length);
  const needsMultiBusiness =
    establishments.length >= 1 && !(isAccountLive(account) && isMultiBusinessAccount(account));

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.h1}>{t("establishments.title")}</h1>
        <p className={ui.muted}>{t("establishments.subtitle")}</p>
      </div>

      <EstablishmentList
        establishments={establishments}
        activeMerchantId={merchant.id}
        accountLive={isAccountLive(account)}
      />

      {needsMultiBusiness && <MultiBusinessSubscribeCard />}

      <AddEstablishmentForm disabled={!canAdd} />
    </div>
  );
}
