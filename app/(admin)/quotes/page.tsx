import { formatDateTime, formatMoney, quotePublicUrl } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Quote } from "@/lib/types";

export default async function QuotesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: quotes }, { data: profileData }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Quote[]>(),
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);
  const profile = profileData as Profile | null;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Devis</h1>
          <p className="subtitle">Tous les liens envoyes, avec leur historique d'ouverture.</p>
        </div>
      </header>

      <section className="quotes-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Bibliotheque</h2>
            <p>Vue rapide des devis generes.</p>
          </div>

          <div className="list">
            {(quotes || []).map((quote) => (
              <section className="quote-card" key={quote.id}>
                <header>
                  <div>
                    <h3>{quote.prospect_name}</h3>
                    <p>
                      {formatMoney(quote.amount, profile?.currency || "FCFA")} - cree le{" "}
                      {formatDateTime(quote.created_at)}
                    </p>
                  </div>
                  <span className={`badge ${quote.opened ? "green" : "amber"}`}>
                    {quote.opened ? "Vu" : "En attente"}
                  </span>
                </header>
                <div className="quote-actions">
                  <a className="secondary" href={quotePublicUrl(quote.public_token)} target="_blank" rel="noreferrer">
                    Ouvrir le lien public
                  </a>
                </div>
              </section>
            ))}

            {quotes?.length === 0 ? <p className="notice">Aucun devis pour le moment.</p> : null}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Stockage</h2>
            <p>Les PDF restent prives et sont exposes par signed URL.</p>
          </div>
          <div className="list">
            {(quotes || []).slice(0, 5).map((quote) => (
              <section className="quote-card" key={quote.id}>
                <h3>{quote.public_token}</h3>
                <p>{quote.pdf_path}</p>
                <p>Ouvertures : {quote.open_count}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
