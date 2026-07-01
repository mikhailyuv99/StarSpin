import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("meta.merchantTitle"),
    description: t("meta.merchantDescription"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default function PublicMerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="overflow-x-hidden">{children}</div>;
}
