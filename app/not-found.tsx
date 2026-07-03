import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-page">
      <section className="auth-card error-card">
        <span className="error-code">Lien indisponible</span>
        <h1>Page introuvable</h1>
        <p className="subtitle">
          Ce lien de devis est invalide, expire ou le PDF associe n'est plus disponible.
        </p>
        <div>
          <Link className="secondary" href="/">
            Retour
          </Link>
        </div>
      </section>
    </main>
  );
}
