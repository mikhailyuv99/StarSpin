# Roue Fidélité

Plateforme SaaS multi-tenant de fidélisation pour restaurants et commerces (Da Nang). QR code → OTP SMS → réseaux sociaux → avis Google → roue de la fortune.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (Postgres, Auth, RLS, Storage)
- **Netlify** (hébergement)
- **Twilio** (OTP SMS, optionnel en dev)
- **Google Places API** (cron suivi avis, optionnel)

## Démarrage local

```bash
cp .env.example .env.local
# Remplir les variables Supabase

# Appliquer la migration SQL dans Supabase SQL Editor :
# supabase/migrations/001_initial_schema.sql

npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Mode dev OTP

Sans Twilio configuré, le code OTP est affiché dans la réponse API (`devCode`) et loggé en console serveur.

### Premier admin

Après inscription, ajoutez votre `user_id` dans la table `admins` :

```sql
INSERT INTO admins (user_id) VALUES ('votre-uuid-auth');
```

## Déploiement Netlify

1. Pousser sur GitHub
2. Connecter le repo à Netlify
3. Variables d'environnement : copier `.env.example`
4. Build command : `npm run build` (configuré dans `netlify.toml`)
5. Plugin `@netlify/plugin-nextjs` installé automatiquement

### Cron avis Google

Configurer une requête planifiée (Netlify Scheduled Functions ou cron externe) :

```
GET https://votre-app.netlify.app/api/cron/review-counts
Authorization: Bearer <CRON_SECRET>
```

## Structure

| Route | Description |
|-------|-------------|
| `/` | Landing |
| `/r/[slug]` | Page publique client (flow complet) |
| `/login` | Auth commerçant |
| `/setup` | Création commerce (première connexion) |
| `/dashboard/*` | Dashboard commerçant |
| `/admin` | Super-admin |

## Documentation

- [Options vérification avis Google](docs/REVIEW_VERIFICATION.md)

## Licence

Privé — usage interne.
