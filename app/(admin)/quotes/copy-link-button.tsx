"use client";

import { useState } from "react";

export function CopyLinkButton({
  copiedLabel = "Lien copie",
  label = "Copier le lien",
  value,
}: {
  copiedLabel?: string;
  label?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button className="secondary" type="button" onClick={copyLink}>
      {copied ? copiedLabel : label}
    </button>
  );
}
