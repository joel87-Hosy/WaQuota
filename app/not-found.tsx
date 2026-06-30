import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Page introuvable</h1>
        <p className="subtitle">Ce lien de devis est invalide ou indisponible.</p>
        <div style={{ marginTop: 18 }}>
          <Link className="secondary" href="/">
            Retour
          </Link>
        </div>
      </section>
    </main>
  );
}
