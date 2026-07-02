# STARSPIN (Roue Fidélité)

Plateforme SaaS multi-tenant de fidélisation pour restaurants et commerces. Site officiel : **[starspin.cc](https://starspin.cc)**

QR code → réseaux sociaux → avis Google → roue de la fortune.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (Postgres, Auth, RLS, Storage)
- **Netlify** (hébergement, domaine `starspin.cc`)
- **Stripe** (abonnements 34€/mo · 340€/an)
- **Twilio** (OTP SMS, optionnel en dev)
- **Google Places API** (cron suivi avis, optionnel)

## Démarrage local

```bash
cp .env.example .env.local
# Remplir les variables Supabase

# Appliquer les migrations SQL dans Supabase SQL Editor :
# supabase/migrations/*.sql

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

## Déploiement Netlify + starspin.cc

1. Pousser sur GitHub
2. Connecter le repo à Netlify
3. Variables d'environnement : copier `.env.example` (`NEXT_PUBLIC_APP_URL=https://starspin.cc`)
4. Domaine personnalisé : ajouter `starspin.cc` (et `www.starspin.cc` si besoin) dans Netlify → Domain management
5. Build command : `npm run build` (configuré dans `netlify.toml`)

### Supabase Auth (Google / Apple)

Dans **Authentication → URL Configuration** :

- **Site URL** : `https://starspin.cc`
- **Redirect URLs** :
  - `https://starspin.cc/auth/callback`
  - `http://localhost:3000/auth/callback`

Le callback Supabase (`https://<project>.supabase.co/auth/v1/callback`) reste configuré côté Google / Apple Developer.

### Stripe

- Webhook : `https://starspin.cc/api/stripe/webhook`
- Vérifier le domaine Apple Pay dans Stripe → Settings → Payment methods

### Cron avis Google

Configurer une requête planifiée (Netlify Scheduled Functions ou cron externe) :

```
GET https://starspin.cc/api/cron/review-counts
Authorization: Bearer <CRON_SECRET>
```

## Structure

| Route | Description |
|-------|-------------|
| `/` | Landing |
| `/{slug}` | Page publique client (flow complet) |
| `/login` | Auth commerçant |
| `/setup` | Création commerce (première connexion) |
| `/dashboard/*` | Dashboard commerçant |
| `/admin` | Super-admin |

## Documentation

- [Options vérification avis Google](docs/REVIEW_VERIFICATION.md)

## Licence

Privé — usage interne.
