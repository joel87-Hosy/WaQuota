import { redirect } from "next/navigation";
import { signIn, signUp } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand" style={{ color: "#182026", marginBottom: 18 }}>
          <div className="brand-mark">WQ</div>
          <div>
            <strong>WaQuote</strong>
            <span style={{ color: "#68737d" }}>Connexion admin</span>
          </div>
        </div>

        {searchParams.error ? <p className="notice">{searchParams.error}</p> : null}

        <form className="form" action={signIn}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" required minLength={6} />
          </div>
          <button className="primary" type="submit">
            Se connecter
          </button>
          <button className="secondary" formAction={signUp} type="submit">
            Creer un compte
          </button>
        </form>
      </section>
    </main>
  );
}
