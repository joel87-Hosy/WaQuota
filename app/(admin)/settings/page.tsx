import { saveSettings } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();
  const profile = profileData as Profile | null;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Reglages</h1>
          <p className="subtitle">Parametres de relance et modeles WhatsApp.</p>
        </div>
      </header>

      {searchParams.error ? <p className="notice">{searchParams.error}</p> : null}

      <form className="settings-grid" action={saveSettings}>
        <article className="panel">
          <div className="panel-header">
            <h2>Entreprise</h2>
            <p>Ces valeurs personnalisent les messages envoyes.</p>
          </div>
          <div className="form">
            <div className="field">
              <label htmlFor="company-name">Nom commercial</label>
              <input id="company-name" name="company_name" defaultValue={profile?.company_name || ""} />
            </div>
            <div className="field">
              <label htmlFor="sender-phone">Numero WhatsApp</label>
              <input id="sender-phone" name="whatsapp_phone" defaultValue={profile?.whatsapp_phone || ""} />
            </div>
            <div className="field">
              <label htmlFor="currency">Devise</label>
              <input id="currency" name="currency" defaultValue={profile?.currency || "FCFA"} />
            </div>
            <div className="field">
              <label htmlFor="delay">Delai de relance en heures</label>
              <input
                id="delay"
                name="reminder_delay_hours"
                type="number"
                min="1"
                defaultValue={profile?.reminder_delay_hours || 48}
              />
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Message de relance</h2>
            <p>Variables disponibles : {"{{prospect}}"}, {"{{amount}}"}, {"{{link}}"}.</p>
          </div>
          <div className="form">
            <div className="field">
              <label htmlFor="template">Modele WhatsApp</label>
              <textarea
                id="template"
                name="reminder_template"
                defaultValue={
                  profile?.reminder_template ||
                  "Bonjour {{prospect}}, je me permets de vous relancer concernant le devis de {{amount}}. Voici le lien : {{link}}"
                }
              />
            </div>
            <button className="primary" type="submit">
              Sauvegarder
            </button>
          </div>
        </article>
      </form>
    </>
  );
}
