import { deleteQuote, markReminderSent, updateQuote } from "@/app/actions";
import { CopyLinkButton } from "@/app/(admin)/quotes/copy-link-button";
import {
  buildWhatsappUrl,
  formatDateTime,
  formatMoney,
  isUrgent,
  quotePublicUrl,
  quoteReminderMessage,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Quote } from "@/lib/types";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams?: { error?: string; filter?: string };
}) {
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
  const delay = profile?.reminder_delay_hours || 48;
  const allRows = quotes || [];
  const dueRows = allRows.filter((quote) => isUrgent(quote.created_at, quote.opened, delay));
  const rows = searchParams?.filter === "due" ? dueRows : allRows;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Devis</h1>
          <p className="subtitle">Tous les liens envoyes, avec leur historique d'ouverture.</p>
        </div>
        <div className="quote-actions">
          <a className={searchParams?.filter === "due" ? "primary" : "secondary"} href="/quotes?filter=due">
            A relancer aujourd'hui
          </a>
          <a className={!searchParams?.filter ? "primary" : "secondary"} href="/quotes">
            Tous les devis
          </a>
        </div>
      </header>

      {searchParams?.error ? <p className="notice">{searchParams.error}</p> : null}

      <section className="quotes-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Bibliotheque</h2>
            <p>Vue rapide des devis generes.</p>
          </div>

          <div className="list">
            {rows.map((quote) => {
              const publicUrl = quotePublicUrl(quote.public_token);
              const urgentQuote = isUrgent(quote.created_at, quote.opened, delay);
              const message = quoteReminderMessage(quote, profile);
              const whatsappUrl = buildWhatsappUrl(quote.prospect_phone, message);

              return (
              <section className="quote-card" key={quote.id}>
                <header>
                  <div>
                    <h3>{quote.prospect_name}</h3>
                    <p>
                      {formatMoney(quote.amount, profile?.currency || "FCFA")} - cree le{" "}
                      {formatDateTime(quote.created_at)}
                    </p>
                  </div>
                  <span className={`badge ${quote.opened ? "green" : urgentQuote ? "red" : "amber"}`}>
                    {quote.opened ? "Vu" : urgentQuote ? "Relance a faire" : "En attente"}
                  </span>
                </header>

                <form className="quote-edit-form" action={updateQuote}>
                  <input name="id" type="hidden" value={quote.id} />
                  <div className="field">
                    <label htmlFor={`name-${quote.id}`}>Prospect</label>
                    <input id={`name-${quote.id}`} name="prospect_name" required defaultValue={quote.prospect_name} />
                  </div>
                  <div className="field">
                    <label htmlFor={`phone-${quote.id}`}>WhatsApp</label>
                    <input id={`phone-${quote.id}`} name="prospect_phone" required defaultValue={quote.prospect_phone} />
                  </div>
                  <div className="field">
                    <label htmlFor={`amount-${quote.id}`}>Montant</label>
                    <input
                      id={`amount-${quote.id}`}
                      name="amount"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={quote.amount}
                    />
                  </div>
                  <button className="secondary" type="submit">
                    Modifier
                  </button>
                </form>

                <div className="quote-actions">
                  <a className="secondary" href={publicUrl} target="_blank" rel="noreferrer">
                    Ouvrir le lien public
                  </a>
                  <CopyLinkButton value={publicUrl} />
                  <CopyLinkButton value={message} label="Copier message" copiedLabel="Message copie" />
                  <a className="whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
                    Ouvrir WhatsApp
                  </a>
                  {!quote.opened ? (
                    <form action={markReminderSent}>
                      <input name="id" type="hidden" value={quote.id} />
                      <button className="secondary" type="submit">
                        Relance envoyee
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteQuote}>
                    <input name="id" type="hidden" value={quote.id} />
                    <input name="pdf_path" type="hidden" value={quote.pdf_path} />
                    <button className="danger" type="submit">
                      Supprimer
                    </button>
                  </form>
                </div>
              </section>
              );
            })}

            {rows.length === 0 ? <p className="notice">Aucun devis pour le moment.</p> : null}
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
                <p>Derniere relance : {formatDateTime(quote.reminder_sent_at)}</p>
                <p>Total relances : {quote.reminder_count || 0}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
