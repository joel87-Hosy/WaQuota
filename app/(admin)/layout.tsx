import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">WQ</div>
          <div>
            <strong>WaQuote</strong>
            <span>Suivi de devis PDF</span>
          </div>
        </div>

        <nav className="nav" aria-label="Navigation principale">
          <Link href="/">Tableau</Link>
          <Link href="/quotes">Devis</Link>
          <Link href="/settings">Reglages</Link>
          <a className="nav-logout-button" href="/logout">
            Deconnexion
          </a>
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
