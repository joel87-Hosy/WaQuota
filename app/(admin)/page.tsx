import { createQuote } from "@/app/actions";
import {
  buildWhatsappUrl,
  formatDateTime,
  formatMoney,
  isUrgent,
  quotePublicUrl,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Quote } from "@/lib/types";

function whatsappMessage(quote: Quote, profile: Profile | null) {
  const amount = formatMoney(quote.amount, profile?.currency || "FCFA");
  const link = quotePublicUrl(quote.public_token);
  const template =
    profile?.reminder_template ||
    "Bonjour {{prospect}}, je me permets de vous relancer concernant le devis de {{amount}}. Voici le lien : {{link}}";

  return template
    .replaceAll("{{prospect}}", quote.prospect_name)
    .replaceAll("{{amount}}", amount)
    .replaceAll("{{link}}", link);
}

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
        </section>
      </header>

      {searchParams.error ? <p className="notice">{searchParams.error}</p> : null}

      <section className="grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Nouveau devis</h2>
            <p>Le PDF sera stocke dans le bucket prive Supabase.</p>
          </div>

          <form className="form" action={createQuote}>
            <label className="drop">
              <input name="pdf" type="file" accept="application/pdf" required hidden />
              <span>
                <strong>Deposer le PDF</strong>
                PDF uniquement, 10 Mo maximum
              </span>
            </label>

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

        <article className="panel">
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
                {sorted.map((quote) => {
                  const urgentQuote = isUrgent(quote.created_at, quote.opened, delay);
                  const message = whatsappMessage(quote, profile);
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
                          <span className="badge red">Pas ouvert</span>
                        ) : (
                          <span className="badge amber">En attente</span>
                        )}
                      </td>
                      <td>{quote.open_count}</td>
                      <td>
                        <a className="whatsapp" target="_blank" rel="noreferrer" href={href}>
                          {quote.opened ? "Demander un retour" : "Relancer sur WhatsApp"}
                        </a>
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
