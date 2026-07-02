"use client";

import { useState } from "react";
import { ui } from "@/components/ui/styles";

export function CopyPublicLinkButton({
  url,
  copyLabel,
  copiedLabel,
}: {
  url: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={copy} className={`${ui.btnOutline} !w-auto px-4 py-2 text-sm`}>
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
