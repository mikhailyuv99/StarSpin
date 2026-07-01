import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Participation",
  description: "Programme de fidélisation",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function PublicMerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="overflow-x-hidden">{children}</div>;
}
