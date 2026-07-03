import { redirect } from "next/navigation";
import Link from "next/link";
import { requestPasswordReset, signIn, signUp } from "@/app/actions";
import { PasswordField } from "@/app/login/password-field";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string; mode?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignup = searchParams.mode === "signup";
  const isReset = searchParams.mode === "reset";

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-page">
      <section className={`auth-card ${isSignup ? "auth-card-signup" : ""}`}>
        <div className="brand" style={{ color: "#182026", marginBottom: 18 }}>
          <div className="brand-mark">WQ</div>
          <div>
            <strong>WaQuote</strong>
            <span style={{ color: "#68737d" }}>
              {isReset ? "Reinitialisation du mot de passe" : isSignup ? "Creation du compte admin" : "Connexion admin"}
            </span>
          </div>
        </div>

        {isSignup ? (
          <div className="auth-intro">
            <h1>Creer votre espace</h1>
            <p>Ajoutez vos devis PDF, suivez les ouvertures et preparez vos relances WhatsApp.</p>
          </div>
        ) : null}

        {isReset ? (
          <div className="auth-intro">
            <h1>Mot de passe oublie</h1>
            <p>Entrez votre email et nous vous enverrons un lien de reinitialisation.</p>
          </div>
        ) : null}

        {searchParams.error ? <p className="notice">{searchParams.error}</p> : null}
        {searchParams.message ? <p className="notice success">{searchParams.message}</p> : null}

        <form className="form" action={isReset ? requestPasswordReset : isSignup ? signUp : signIn}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          {!isReset ? (
            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <PasswordField />
            </div>
          ) : null}
          <button className="primary" type="submit">
            {isReset ? "Envoyer le lien" : isSignup ? "Creer mon compte" : "Se connecter"}
          </button>
          {isReset ? (
            <Link className="secondary auth-alt" href="/login">
              Retour connexion
            </Link>
          ) : isSignup ? (
            <Link className="secondary auth-alt" href="/login">
              J'ai deja un compte
            </Link>
          ) : (
            <div className="auth-links">
              <Link className="secondary auth-alt" href="/login?mode=signup">
                Creer un compte
              </Link>
              <Link className="ghost-link" href="/login?mode=reset">
                Mot de passe oublie
              </Link>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
