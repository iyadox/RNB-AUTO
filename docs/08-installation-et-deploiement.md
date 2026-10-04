# 08 — Installation et mise en ligne

> Version du 04/10/2026. Ce guide suppose aucune connaissance particulière : suivez les étapes dans l'ordre.

## En bref

| Besoin | Solution recommandée | Coût pour démarrer |
|---|---|---|
| Code du site | ce dépôt GitHub | gratuit |
| Hébergement du site | **Vercel** (relié à GitHub : chaque modification est mise en ligne seule) | offre gratuite suffisante pour démarrer |
| Base de données | **Neon** (PostgreSQL), créée depuis Vercel | offre gratuite suffisante pour démarrer |
| Emails des nouvelles demandes (facultatif) | **Resend** | offre gratuite |
| Nom de domaine (facultatif au début) | n'importe quel registraire (OVH, Gandi, Vercel…) | ~10 € / an |

Les adresses, itinéraires et prix du carburant utilisent des **services publics gratuits** (IGN Géoplateforme, OSRM, données officielles des prix des carburants) : aucune clé n'est nécessaire.

---

## 1. Essayer le site sur son ordinateur

Prérequis : [Node.js](https://nodejs.org) version 22 (« LTS »), et [Git](https://git-scm.com).

```bash
git clone https://github.com/iyadox/rnb-auto.git
cd rnb-auto
npm install
cp .env.example .env      # sous Windows : copy .env.example .env
npm run dev
```

Ouvrez <http://localhost:3000>.

- La base de données locale est créée et remplie **automatiquement** au premier lancement (dossier `.data/`, ignoré par Git). Rien à installer.
- Espace de gestion : <http://localhost:3000/admin>. La première visite propose de **créer le compte administrateur**.
- Sans connexion internet, mettez `GEO_PROVIDER=simulation` dans `.env` : les distances sont alors approximatives (un bandeau rouge le rappelle dans l'administration).
- Pour repartir de zéro : arrêtez le site et supprimez le dossier `.data/`.

---

## 2. Mettre en ligne avec Vercel et Neon (recommandé)

### 2.1 Créer le projet

1. Créez un compte sur [vercel.com](https://vercel.com) avec votre compte GitHub.
2. **Add New → Project**, puis importez le dépôt `rnb-auto`. Ne changez aucun réglage de construction : Vercel détecte Next.js et lance automatiquement `npm run vercel-build` (migrations de la base, données de départ, puis construction du site).
3. Avant de cliquer sur **Deploy**, ajoutez la base de données (étape suivante). Si le premier déploiement échoue avec le message « DATABASE_URL est vide », c'est simplement que la base n'est pas encore reliée.

### 2.2 Créer la base de données

1. Dans le projet Vercel : onglet **Storage** → créer une base de données → **Neon** (PostgreSQL).
2. Choisissez une **région en Europe** (par exemple Francfort), puis reliez la base au projet pour tous les environnements.
3. Vercel ajoute alors automatiquement la variable `DATABASE_URL`. Rien d'autre à faire.

> Autre fournisseur PostgreSQL (Supabase, Scaleway…) : copiez son adresse de connexion dans la variable `DATABASE_URL`. Chez Supabase, prenez l'adresse du **« Transaction pooler »**.

### 2.3 Renseigner les variables d'environnement

Projet Vercel → **Settings → Environment Variables** :

| Variable | Valeur | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | l'adresse du site, sans `/` à la fin (ex. `https://rnb-auto.vercel.app`, puis votre domaine) | oui |
| `SETUP_TOKEN` | une longue phrase secrète, demandée une seule fois pour créer le premier compte | oui |
| `CRON_SECRET` | une longue chaîne aléatoire (ex. générée par un gestionnaire de mots de passe) | conseillé |
| `RESEND_API_KEY` et `EMAIL_FROM` | pour recevoir chaque nouvelle demande par email (voir 2.6) | non |

Puis **Deployments → Redeploy** pour prendre en compte les variables.

### 2.4 Créer le compte administrateur

1. Ouvrez `https://votre-site/admin/installation`.
2. Saisissez le **code d'installation** (la valeur de `SETUP_TOKEN`), votre nom, votre email et un mot de passe (10 caractères minimum, avec au moins une lettre et un chiffre).
3. Cette page se ferme définitivement dès que le compte existe.

### 2.5 Ce qu'il faut remplir en premier

L'accueil de l'administration affiche une liste « Pour démarrer ». Dans l'ordre :

1. **Paramètres → Entreprise** : téléphone, WhatsApp, email, disponibilité (ex. « 24h/24 · 7j/7 »). Tant qu'un numéro manque, le site affiche « À COMPLÉTER ».
2. **Paramètres → Adresse de départ** : vérifiez sur la carte que le repère est bien sur le dépôt, puis confirmez. Toutes les distances partent de ce point.
3. **Paramètres → Mentions légales** : raison sociale, forme juridique, SIRET, directeur de la publication, hébergeur (nom, adresse et téléphone de l'hébergeur, tels qu'indiqués dans ses conditions d'utilisation).
4. **Mes tarifs** : les valeurs de départ sont des **moyennes du marché francilien** (octobre 2026). Ajustez-les à votre politique de prix, puis vérifiez le résultat dans **Tester mes tarifs**.
5. **Paramètres → Notifications** : l'email qui reçoit les nouvelles demandes.

### 2.6 Recevoir les demandes par email (facultatif)

1. Créez un compte sur [resend.com](https://resend.com), ajoutez et vérifiez votre nom de domaine (quelques enregistrements DNS à copier).
2. Créez une clé d'API, puis dans Vercel : `RESEND_API_KEY` = la clé, `EMAIL_FROM` = par exemple `RNB AUTO <demandes@votre-domaine.fr>`.
3. Redéployez, puis **Paramètres → Services externes → Envoyer un email d'essai**.

Sans email configuré, rien n'est perdu : chaque demande apparaît dans l'administration (le menu affiche le nombre de nouvelles demandes).

### 2.7 Nom de domaine

Vercel → **Settings → Domains** → ajoutez votre domaine et suivez les indications DNS. Mettez ensuite `NEXT_PUBLIC_SITE_URL` à jour et redéployez.

### 2.8 Entretien automatique

Le fichier `vercel.json` déclare une tâche quotidienne (`/api/maintenance`, vers 4 h du matin heure universelle) qui :

- supprime les estimations non suivies d'une demande au bout de 30 jours, et les photos 12 mois après la fin d'une intervention (engagements de la page « Confidentialité ») ;
- nettoie les sessions expirées et les compteurs techniques ;
- actualise le prix du carburant si le mode automatique est activé.

Elle est protégée par `CRON_SECRET` (Vercel l'envoie automatiquement). Sans tâche planifiée, l'entretien est lancé lors des visites de l'administration, au plus toutes les 6 heures.

### 2.9 Mettre à jour le site

Chaque envoi sur la branche principale du dépôt GitHub est **mis en ligne automatiquement** par Vercel. Les migrations de la base sont appliquées à chaque construction ; vos réglages et vos demandes ne sont jamais écrasés (les données de départ ne complètent que ce qui manque).

---

## 3. Autre hébergement : Docker

Pour un serveur à vous (VPS, NAS…), le dépôt contient un `Dockerfile` et un `docker-compose.yml` (site + PostgreSQL).

```bash
cp .env.example .env
# Dans .env : POSTGRES_PASSWORD, NEXT_PUBLIC_SITE_URL, SETUP_TOKEN (et CRON_SECRET, RESEND_API_KEY, EMAIL_FROM si besoin)
docker compose up -d --build
```

- Au démarrage, le conteneur applique les migrations et les données de départ, puis lance le site sur le port 3000.
- **HTTPS est indispensable en production** : la connexion à l'administration utilise un cookie sécurisé qui n'est pas accepté en HTTP (sauf sur `localhost`). Placez le site derrière un proxy HTTPS, par exemple [Caddy](https://caddyserver.com) :

  ```caddyfile
  votre-domaine.fr {
  	encode zstd gzip
  	reverse_proxy localhost:3000 {
  		header_up -Accept-Encoding
  	}
  }
  ```

  - `encode zstd gzip` : Caddy compresse les pages en zstd (ou en gzip pour les navigateurs qui ne lisent pas zstd).
  - `header_up -Accept-Encoding` : le site ne compresse plus lui-même ce qu'il envoie à Caddy. Sans cette ligne, `next start` répond déjà en gzip au niveau par défaut, et Caddy ne recompresse jamais une réponse déjà compressée : la directive `encode` resterait sans effet.
  - Pourquoi : le poids des pages (budget G.2 de [09 — Refonte immersive](09-refonte-immersive.md), 40 Ko compressés pour l'accueil) se mesure avec la compression du serveur de production. Sur Vercel, rien à faire : les pages sont compressées en brotli quand le navigateur l'accepte.
- Compte administrateur en ligne de commande : `docker compose exec app node dist-scripts/create-admin.cjs --email vous@exemple.fr --name "Votre nom" --password "Votre mot de passe"`.
- Entretien quotidien (facultatif) : `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://votre-domaine.fr/api/maintenance` dans une tâche cron.
- Sauvegardes : `docker compose exec db pg_dump -U rnb rnb > sauvegarde.sql`.

---

## 4. Toutes les variables d'environnement

| Variable | Rôle | Par défaut |
|---|---|---|
| `DATABASE_URL` | adresse PostgreSQL (`postgres://…`) ; `pglite:./.data/pglite` pour la base locale de développement. `POSTGRES_URL` est aussi accepté. | base locale en développement ; **obligatoire en production** |
| `NEXT_PUBLIC_SITE_URL` | adresse publique du site | adresse Vercel, sinon `http://localhost:3000` |
| `SETUP_TOKEN` | code de création du premier compte | obligatoire en production |
| `CRON_SECRET` | protège la tâche d'entretien | entretien lors des visites de l'administration |
| `RESEND_API_KEY`, `EMAIL_FROM` | envoi des emails | pas d'email (demandes visibles dans l'administration) |
| `GEO_PROVIDER` | `auto` (services publics) ou `simulation` (essais hors ligne) | `auto` |
| `OPENROUTESERVICE_API_KEY` | service d'itinéraires de secours supplémentaire | non utilisé |
| `SEED_COMPANY_PHONE`, `SEED_COMPANY_WHATSAPP`, `SEED_COMPANY_EMAIL`, `SEED_COMPANY_AVAILABILITY` | pré-remplissage à la toute première installation | vides (« À COMPLÉTER ») |
| `POSTGRES_PASSWORD` | Docker uniquement | — |
| `DATABASE_POOL_MAX` | connexions simultanées à PostgreSQL | 5 |
| `ALLOW_GEO_SIMULATION` | autorise la simulation des trajets en production (déconseillé) | non |

Aucun secret n'est jamais écrit dans le code ni dans la base : uniquement dans ces variables.

---

## 5. Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | site en développement sur <http://localhost:3000> |
| `npm run build` puis `npm start` | site en mode production |
| `npm run check` | typage + règles de code + tests (à lancer avant chaque envoi) |
| `npm test` | tests du moteur tarifaire, des réglages, des photos et des parcours serveur |
| `npm run e2e` | parcours complets dans un navigateur (installer d'abord : `npx playwright install chromium`) |
| `npm run db:setup` | migrations + données de départ manquantes (base désignée par `DATABASE_URL`) |
| `npm run db:generate` | nouvelle migration après une modification de `src/server/db/schema.ts` |
| `npm run admin:create` | crée ou réinitialise un compte administrateur (utile en cas de mot de passe oublié) |

Les vérifications (typage, lint, tests, construction, parcours dans un navigateur) tournent aussi automatiquement sur GitHub à chaque envoi (`.github/workflows/ci.yml`).

---

## 6. En cas de problème

| Symptôme | Solution |
|---|---|
| Le déploiement échoue : « DATABASE_URL est vide » | reliez une base Neon au projet (2.2), puis redéployez |
| `/admin/installation` affiche « SETUP_TOKEN n'est pas configurée » | ajoutez la variable (2.3) puis redéployez |
| Impossible de rester connecté (Docker) | le site doit être servi en HTTPS (section 3) |
| Bandeau rouge « Mode simulation des trajets » | retirez `GEO_PROVIDER=simulation` des variables |
| Les prix ne s'affichent plus sur le site | **Paramètres → Services externes → Tester le calcul des trajets**. En cas de panne d'un service public, les clients peuvent toujours appeler et envoyer une demande : vous les rappelez avec un prix |
| Mot de passe oublié | depuis un ordinateur avec le code : mettre l'adresse de la base de production dans `DATABASE_URL`, puis `npm run admin:create` |
