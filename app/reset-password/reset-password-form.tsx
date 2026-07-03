"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function updatePassword(formData: FormData) {
    setIsPending(true);
    setMessage("");

    const password = String(formData.get("password") || "");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setIsPending(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Mot de passe mis a jour. Vous pouvez vous connecter.");
  }

  return (
    <form className="form" action={updatePassword}>
      {message ? <p className="notice success">{message}</p> : null}
      <div className="field">
        <label htmlFor="password">Nouveau mot de passe</label>
        <input id="password" name="password" type="password" required minLength={6} />
      </div>
      <button className="primary" type="submit" disabled={isPending}>
        {isPending ? "Mise a jour..." : "Mettre a jour"}
      </button>
      <a className="secondary auth-alt" href="/login">
        Retour connexion
      </a>
    </form>
  );
}
