import { revalidatePath, revalidateTag } from "next/cache";
import { publicMerchantTag } from "@/lib/public-merchant";

/** Bust cached public journey HTML/data for a merchant slug. */
export function revalidatePublicMerchant(slug: string) {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return;
  revalidateTag(publicMerchantTag(normalized), "max");
  revalidatePath(`/${normalized}`);
  revalidatePath(`/${normalized}/play`);
}
