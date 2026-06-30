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
