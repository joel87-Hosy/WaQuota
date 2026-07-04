"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/quotes");
    router.prefetch("/settings");
  }, [router]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-mark">WQ</div>
          <div>
            <strong>WaQuote</strong>
            <span>Suivi de devis PDF</span>
          </div>
        </div>

        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Masquer le menu" : "Afficher le menu"}
          className="menu-toggle"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className="sidebar-menu">
        <div className="sidebar-menu-inner">
          <nav className="nav" aria-label="Navigation principale">
            <Link className={pathname === "/" ? "active" : ""} href="/" onClick={closeMenu}>
              Tableau
            </Link>
            <Link className={pathname === "/quotes" ? "active" : ""} href="/quotes" onClick={closeMenu}>
              Devis
            </Link>
            <Link className={pathname === "/settings" ? "active" : ""} href="/settings" onClick={closeMenu}>
              Reglages
            </Link>
          </nav>

          <div className="sidebar-footer">
            <a className="nav-logout-button" href="/logout">
              Deconnexion
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
