# Vérification des avis Google — Options et compromis

Ce document résume les options pour vérifier qu'un client a bien laissé un avis Google, avant de choisir l'approche implémentée (capture d'écran + OCR + revue manuelle).

## Option 1 : Capture d'écran + OCR (implémentée en v1)

**Principe** : Le client uploade une capture après avoir posté son avis. Tesseract.js extrait le texte ; on cherche le nom du commerce et des indices d'étoiles.

| Critère | Évaluation |
|---------|------------|
| Coût | Gratuit (Tesseract côté client) |
| Fiabilité individuelle | Moyenne — falsifiable avec Photoshop |
| Délai | Immédiat |
| Friction UX | Moyenne (upload requis) |
| Maintenance | Faible |

**Verdict v1** : Bon compromis rapidité/coût pour 20-30 commerçants. Revue manuelle dans le dashboard pour les cas `pending`.

---

## Option 2 : Google Places API (Place Details — champ `reviews`)

**Principe** : Récupérer les 5 avis les plus récents/pertinents d'un lieu.

| Critère | Évaluation |
|---------|------------|
| Coût | ~$17/1000 requêtes (Place Details) |
| Fiabilité individuelle | **Impossible** — max 5 avis, pas d'identifiant client, pas de lien téléphone→avis |
| Délai | Quelques heures (pas temps réel) |
| Usage réaliste | Signal de cohérence global (cron `review_counts_history`) |

**Verdict** : Utile pour le dashboard stats, pas pour valider un spin individuel.

---

## Option 3 : Google Business Profile API

**Principe** : Le commerçant connecte son compte Google Business ; l'API liste tous les avis avec auteur, note, date.

| Critère | Évaluation |
|---------|------------|
| Coût | Gratuit (quota API) |
| Fiabilité individuelle | **Toujours pas de lien client** — on voit les avis mais pas "cet utilisateur avec ce numéro a posté" |
| Setup | OAuth complexe, chaque commerçant doit autoriser |
| Délai | Quasi temps réel côté Google |

**Verdict** : Excellent pour gérer/répondre aux avis, insuffisant pour prouver qu'un client précis a avisé avant le spin.

---

## Option 4 : Scraping (Outscraper, SerpApi, custom)

| Critère | Évaluation |
|---------|------------|
| Coût | Variable ($20-100+/mois) |
| Fiabilité | Meilleure couverture que Places API |
| Risque | Violation ToS Google, blocage IP/clé |
| Lien individuel | Toujours absent sans identité Google du client |

**Verdict** : Déconseillé pour un produit SaaS stable.

---

## Option 5 : Outils tiers (Birdeye, Podium, Reputation.com)

| Critère | Évaluation |
|---------|------------|
| Coût | $200-500+/mois — hors budget v1 |
| Fiabilité | Bonne pour les commerçants qui les utilisent déjà |
| Intégration | API propriétaire, onboarding lourd |

**Verdict** : Overkill pour un petit volume local (20–30 clients).

---

## Option 6 : Honor system (bouton "J'ai laissé un avis")

| Critère | Évaluation |
|---------|------------|
| Coût | Zéro |
| Fiabilité | Très faible |
| Friction | Minimale |

**Verdict** : Trop facilement abusé seul ; acceptable seulement combiné à OTP + screenshot.

---

## Recommandation actuelle

**Stack anti-fraude v1** :
1. OTP SMS (barrière principale, 1 spin / 30 jours / numéro)
2. Device fingerprint (couche secondaire)
3. Screenshot + OCR basique → `verified` ou `pending`
4. Revue manuelle commerçant dans `/dashboard/reviews`
5. Cron Places API → `review_counts_history` (signal macro, pas preuve individuelle)

**Aucune solution ne prouve à 100% qu'un numéro de téléphone donné correspond à un avis Google donné** sans que le client s'authentifie avec son compte Google (OAuth) au moment de l'avis — ce qui ajouterait une friction majeure.

### Piste future (v2)
- OAuth Google côté client : prouve l'identité Google mais pas qu'un avis a été posté sur CE commerce
- Augmenter la friction : délai minimum entre clic "Laisser un avis" et upload (ex. 2 min)
- Machine learning sur captures (détection de faux screenshots)
