import { redirect } from "next/navigation";
import Link from "next/link";
import { signIn, signUp } from "@/app/actions";
import { PasswordField } from "@/app/login/password-field";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; mode?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignup = searchParams.mode === "signup";

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
              {isSignup ? "Creation du compte admin" : "Connexion admin"}
            </span>
          </div>
        </div>

        {isSignup ? (
          <div className="auth-intro">
            <h1>Creer votre espace</h1>
            <p>Ajoutez vos devis PDF, suivez les ouvertures et preparez vos relances WhatsApp.</p>
          </div>
        ) : null}

        {searchParams.error ? <p className="notice">{searchParams.error}</p> : null}

        <form className="form" action={isSignup ? signUp : signIn}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <PasswordField />
          </div>
          <button className="primary" type="submit">
            {isSignup ? "Creer mon compte" : "Se connecter"}
          </button>
          {isSignup ? (
            <Link className="secondary auth-alt" href="/login">
              J'ai deja un compte
            </Link>
          ) : (
            <Link className="secondary auth-alt" href="/login?mode=signup">
              Creer un compte
            </Link>
          )}
        </form>
      </section>
    </main>
  );
}
