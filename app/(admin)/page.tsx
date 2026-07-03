import { createQuote, markReminderSent } from "@/app/actions";
import { FileDrop } from "@/app/(admin)/file-drop";
import { CopyLinkButton } from "@/app/(admin)/quotes/copy-link-button";
import {
  buildWhatsappUrl,
  formatDateTime,
  formatMoney,
  isUrgent,
  quoteReminderMessage,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Quote } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
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

  const rows = quotes || [];
  const profile = profileData as Profile | null;
  const delay = profile?.reminder_delay_hours || 48;
  const sorted = [...rows].sort((a, b) => {
    const aUrgent = isUrgent(a.created_at, a.opened, delay) ? 1 : 0;
    const bUrgent = isUrgent(b.created_at, b.opened, delay) ? 1 : 0;
    return bUrgent - aUrgent || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const opened = rows.filter((quote) => quote.opened).length;
  const urgent = rows.filter((quote) => isUrgent(quote.created_at, quote.opened, delay)).length;
  const reminded = rows.filter((quote) => quote.reminder_sent_at).length;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Relances WhatsApp</h1>
          <p className="subtitle">Devis classes par urgence commerciale.</p>
        </div>

        <section className="stats" aria-label="Statistiques">
          <div className="stat">
            <span>Devis envoyes</span>
            <strong>{rows.length}</strong>
          </div>
          <div className="stat">
            <span>Ouverts</span>
            <strong>{opened}</strong>
          </div>
          <div className="stat">
            <span>A relancer</span>
            <strong>{urgent}</strong>
          </div>
          <div className="stat">
            <span>Relances envoyees</span>
            <strong>{reminded}</strong>
          </div>
        </section>
      </header>

      {searchParams.error ? <p className="notice">{searchParams.error}</p> : null}

      <section className="grid dashboard-split">
        <article className="panel quote-create-panel">
          <div className="panel-header">
            <h2>Nouveau devis</h2>
            <p>Le PDF sera stocke dans le bucket prive Supabase.</p>
          </div>

          <form className="form" action={createQuote}>
            <FileDrop />

            <div className="field">
              <label htmlFor="prospect-name">Nom du prospect</label>
              <input id="prospect-name" name="prospect_name" required placeholder="Ex: Koffi Mensah" />
            </div>

            <div className="field">
              <label htmlFor="phone">Telephone WhatsApp</label>
              <input id="phone" name="prospect_phone" required placeholder="+2250700000000" />
            </div>

            <div className="field">
              <label htmlFor="amount">Montant du devis</label>
              <input id="amount" name="amount" required min="0" step="0.01" type="number" placeholder="750000" />
            </div>

            <button className="primary" type="submit">
              Creer le lien
            </button>
          </form>
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-header">
            <h2>Dashboard</h2>
            <p>Les devis non ouverts apres {delay}h remontent en priorite.</p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Ouvertures</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <p className="empty-state">Aucun devis pour le moment.</p>
                    </td>
                  </tr>
                ) : null}

                {sorted.map((quote) => {
                  const urgentQuote = isUrgent(quote.created_at, quote.opened, delay);
                  const message = quoteReminderMessage(quote, profile);
                  const href = buildWhatsappUrl(quote.prospect_phone, message);

                  return (
                    <tr key={quote.id}>
                      <td>
                        <div className="name">
                          <strong>{quote.prospect_name}</strong>
                          <span>Cree le {formatDateTime(quote.created_at)}</span>
                        </div>
                      </td>
                      <td>{formatMoney(quote.amount, profile?.currency || "FCFA")}</td>
                      <td>
                        {quote.opened ? (
                          <span className="badge green">Vu le {formatDateTime(quote.opened_at)}</span>
                        ) : urgentQuote ? (
                          <span className="badge red">Relance a faire</span>
                        ) : (
                          <span className="badge amber">En attente</span>
                        )}
                      </td>
                      <td>
                        {quote.open_count}
                        <span className="muted" style={{ display: "block" }}>
                          Relances : {quote.reminder_count || 0}
                        </span>
                      </td>
                      <td>
                        <div className="quote-actions">
                          <CopyLinkButton value={message} label="Copier message" copiedLabel="Message copie" />
                          <a className="whatsapp" target="_blank" rel="noreferrer" href={href}>
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}
