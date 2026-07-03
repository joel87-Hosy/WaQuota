"use client";

import { useState } from "react";

export function FileDrop() {
  const [fileName, setFileName] = useState("");

  return (
    <label className={`drop ${fileName ? "drop-ready" : ""}`}>
      <input
        name="pdf"
        type="file"
        accept="application/pdf"
        required
        hidden
        onChange={(event) => {
          setFileName(event.target.files?.[0]?.name || "");
        }}
      />
      <span>
        <strong>{fileName ? "PDF selectionne" : "Deposer le PDF"}</strong>
        {fileName || "PDF uniquement, 10 Mo maximum"}
      </span>
    </label>
  );
}
