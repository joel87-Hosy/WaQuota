"use client";

import { useState } from "react";

export function PasswordField() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="password-control">
      <input
        id="password"
        name="password"
        type={isVisible ? "text" : "password"}
        required
        minLength={6}
      />
      <button
        aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="password-toggle"
        type="button"
        onClick={() => setIsVisible((current) => !current)}
      >
        {isVisible ? (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 4.2A9.4 9.4 0 0 1 12 4c5 0 8.5 4.2 9.7 6a2.9 2.9 0 0 1 0 4c-.4.6-.9 1.2-1.6 1.9" />
            <path d="M6.5 6.7A14.4 14.4 0 0 0 2.3 10a2.9 2.9 0 0 0 0 4C3.5 15.8 7 20 12 20c1.6 0 3-.4 4.2-1" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M2.3 10a2.9 2.9 0 0 0 0 4C3.5 15.8 7 20 12 20s8.5-4.2 9.7-6a2.9 2.9 0 0 0 0-4C20.5 8.2 17 4 12 4S3.5 8.2 2.3 10Z" />
            <path d="M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
