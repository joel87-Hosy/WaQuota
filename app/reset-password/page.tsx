import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand" style={{ color: "#182026", marginBottom: 18 }}>
          <div className="brand-mark">WQ</div>
          <div>
            <strong>WaQuote</strong>
            <span style={{ color: "#68737d" }}>Nouveau mot de passe</span>
          </div>
        </div>

        <div className="auth-intro">
          <h1>Definir un nouveau mot de passe</h1>
          <p>Choisissez un mot de passe d'au moins 6 caracteres.</p>
        </div>

        <ResetPasswordForm />
      </section>
    </main>
  );
}
