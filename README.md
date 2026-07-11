# WaQuote

Micro-SaaS de suivi d'ouverture de devis PDF avec relances WhatsApp.

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` vers `.env.local`, puis renseigner :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

La clé `SUPABASE_SERVICE_ROLE_KEY` sert uniquement côté serveur pour la route publique `/read/[token]`.

## Base de donnees

Executer les migrations dans Supabase :

- `supabase/migrations/20260630000000_init_waquote_schema.sql`
- `supabase/migrations/20260630001000_add_profiles.sql`
- `supabase/migrations/20260711000000_seed_admin_account.sql`

Compte admin initial :

- Email : `admin@waquote.local`
- Mot de passe : `admin123`

## Developpement

```bash
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Routes principales

- `/login` : connexion et creation de compte admin
- `/` : dashboard + upload PDF
- `/quotes` : liste des devis
- `/settings` : reglages entreprise et modele WhatsApp
- `/read/[token]` : page publique trackee du devis

## Checklist production pro

- Domaine personnalise : configurer le domaine dans Render, puis mettre `NEXT_PUBLIC_APP_URL=https://votre-domaine.com`.
- Supabase Auth : ajouter le domaine dans `Authentication > URL Configuration`.
- Email de confirmation personnalise : configurer `Authentication > Email Templates` dans Supabase.
- Reset mot de passe : ajouter `https://votre-domaine.com/auth/callback` dans les redirect URLs Supabase.
- WhatsApp automatise : brancher un fournisseur WhatsApp Business API avant d'envoyer automatiquement les relances.
- Secrets : ne jamais publier `.env.local`; ajouter les variables directement dans Render.
