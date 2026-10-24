# 08 — Installation et mise en ligne

> Version du 24/10/2026. Ce guide suppose aucune connaissance particulière : suivez les étapes dans l'ordre.
> Pour l'utilisation de l'espace de gestion au quotidien, voir [10 — Guide de l'administrateur](10-guide-administrateur.md).

## En bref

| Besoin | Solution recommandée | Coût pour démarrer |
|---|---|---|
| Code du site | le dépôt GitHub `iyadox/RNB-AUTO` | gratuit |
| Hébergement du site | **Netlify**, projet « rnb-auto » (relié à GitHub : chaque modification est mise en ligne seule) | offre gratuite suffisante pour démarrer |
| Base de données | **Netlify Database** (PostgreSQL), créée automatiquement par Netlify | incluse |
| Emails des nouvelles demandes (facultatif) | **Resend** | offre gratuite |
| Nom de domaine (facultatif au début) | n'importe quel registraire (OVH, Gandi, Netlify…) | ~10 € / an |

Les adresses, itinéraires et prix du carburant utilisent des **services publics gratuits** (IGN Géoplateforme, OSRM, données officielles des prix des carburants) : aucune clé n'est nécessaire.

Autres hébergements possibles : **Vercel + Neon** (section 3) ou un serveur à vous avec **Docker** (section 4).

> **Aucun secret dans ce dépôt.** Les codes et clés (code d'installation, clé Resend, secret de l'entretien…) se saisissent uniquement chez l'hébergeur, dans ses « variables d'environnement ». Ne les écrivez jamais dans un fichier du dépôt, un ticket ou un message.

---

## 1. Essayer le site sur son ordinateur

Prérequis : [Node.js](https://nodejs.org) version 22 (« LTS »), et [Git](https://git-scm.com).

```bash
git clone https://github.com/iyadox/RNB-AUTO.git
cd RNB-AUTO
npm install
cp .env.example .env      # sous Windows : copy .env.example .env
npm run dev
```

Ouvrez <http://localhost:3000>.

- La base de données locale est créée et remplie **automatiquement** au premier lancement (dossier `.data/`, ignoré par Git). Rien à installer.
- Espace de gestion : <http://localhost:3000/admin>. La première visite propose de **créer le compte administrateur**.
- Sans connexion internet, mettez `GEO_PROVIDER=simulation` dans `.env` : les distances sont alors approximatives (un bandeau rouge le rappelle dans l'administration). **Uniquement sur votre ordinateur**, jamais chez l'hébergeur.
- Pour repartir de zéro : arrêtez le site et supprimez le dossier `.data/`.

---

## 2. Mettre en ligne avec Netlify (recommandé)

### 2.1 Créer le projet « rnb-auto »

1. Créez un compte sur [netlify.com](https://www.netlify.com) **avec votre compte GitHub**.
2. **Add new project → Import an existing project → GitHub.** Autorisez Netlify à lire le dépôt **`iyadox/RNB-AUTO`** (vous pouvez ne donner accès qu'à ce dépôt).
3. Choisissez la **branche à mettre en ligne** : la branche principale (`main`), sauf indication contraire.
4. Nommez le projet **`rnb-auto`**. Le site aura l'adresse `https://rnb-auto.netlify.app` (vous ajouterez votre domaine plus tard, section 2.8).
5. Ne changez **aucun réglage de construction** : ils sont lus dans le fichier `netlify.toml` du dépôt (commande `npm run build`, Node.js 22). Netlify reconnaît Next.js tout seul.
6. Avant de lancer le premier déploiement, ajoutez les variables (section 2.3). Si vous l'avez déjà lancé, ce n'est pas grave : ajoutez-les puis relancez la mise en ligne.

### 2.2 La base de données (rien à faire)

- La base **Netlify Database** (PostgreSQL) est **créée automatiquement** par Netlify pour le projet : le dépôt contient le paquet `@netlify/database`. Netlify donne lui-même son adresse au site (variable `NETLIFY_DB_URL`) : **rien à copier, rien à saisir**.
- Les **migrations** (la structure des tables) sont dans le dossier `netlify/database/migrations` du dépôt. Netlify les **applique à chaque déploiement**, avant de mettre la nouvelle version en ligne.
- Les **données de départ** (tarifs moyens du marché francilien, réglages par défaut, catégories de véhicules) sont ajoutées automatiquement à la première visite. Elles ne complètent que ce qui manque : vos réglages et vos demandes ne sont **jamais écrasés**.

> Pour les développeurs : une nouvelle migration se crée avec `npm run db:generate` (dossier `drizzle/`), puis se copie dans `netlify/database/migrations/<numéro>_<nom>/migration.sql`, avec le même contenu.

### 2.3 Renseigner les variables d'environnement

Projet Netlify → **Project configuration → Environment variables → Add a variable** (dans l'interface en français : « Configuration du site → Variables d'environnement »).

| Variable | Valeur | Obligatoire |
|---|---|---|
| `SETUP_TOKEN` | une longue phrase secrète, que vous inventez. Elle sera demandée **une seule fois**, pour créer le premier compte (2.4). Gardez-la dans votre gestionnaire de mots de passe. | **oui** |
| `NEXT_PUBLIC_SITE_URL` | l'adresse du site, sans `/` à la fin : `https://rnb-auto.netlify.app`, puis votre domaine | conseillé |
| `CRON_SECRET` | une longue chaîne aléatoire (générée par un gestionnaire de mots de passe), pour l'entretien automatique (2.9) | conseillé |
| `RESEND_API_KEY` et `EMAIL_FROM` | pour envoyer les emails (nouvelles demandes, confirmation au client) : voir 2.6 | non, facultatives |

**À ne pas ajouter chez Netlify :**

- **`GEO_PROVIDER`** : la valeur par défaut est la bonne. `simulation` donnerait des distances et des prix approximatifs aux clients.
- `DATABASE_URL` ou `POSTGRES_URL` : elles prendraient la place de la base Netlify.
- Le contenu de votre fichier `.env` local : il est fait pour votre ordinateur (base locale, adresse `localhost`).

Puis **Deploys → Trigger deploy → Deploy project** pour prendre les variables en compte. Il faut relancer la mise en ligne **après chaque changement de variable**, en particulier pour `NEXT_PUBLIC_SITE_URL`, qui est inscrite dans le site au moment de la construction.

> Sans `NEXT_PUBLIC_SITE_URL`, le site utilise automatiquement **l'adresse principale du projet Netlify** (celle de `rnb-auto.netlify.app`, ou votre domaine principal une fois ajouté) pour le plan du site (`sitemap.xml`), le fichier `robots.txt` et les liens de suivi envoyés par email. La renseigner reste plus sûr : c'est l'adresse que vous choisissez.

### 2.4 Créer le compte administrateur

1. Ouvrez `https://rnb-auto.netlify.app/admin/installation`.
2. Saisissez le **code d'installation** (la valeur que vous avez choisie pour `SETUP_TOKEN`), votre nom, votre email et un mot de passe (10 caractères minimum, avec au moins une lettre et un chiffre).
3. Cette page se ferme définitivement dès que le compte existe. D'autres personnes pourront ensuite recevoir un accès depuis **Paramètres → Accès à l'espace** (voir le [guide de l'administrateur](10-guide-administrateur.md)).

### 2.5 Ce qu'il faut remplir en premier

L'accueil de l'administration affiche une liste « Pour démarrer ». Dans l'ordre :

1. **Paramètres → Entreprise** : téléphone, WhatsApp, email, disponibilité (ex. « 24h/24 · 7j/7 »). Tant qu'un numéro manque, le site affiche « À COMPLÉTER ».
2. **Paramètres → Adresse de départ** : vérifiez sur la carte que le repère est bien sur le dépôt, puis confirmez. Toutes les distances partent de ce point.
3. **Paramètres → Mentions légales** : raison sociale, forme juridique, SIRET, directeur de la publication, hébergeur (pour Netlify : nom, adresse et téléphone tels qu'indiqués dans ses conditions d'utilisation).
4. **Mes tarifs** : les valeurs de départ sont des **moyennes du marché francilien** (octobre 2026). Ajustez-les à votre politique de prix, puis vérifiez le résultat dans **Tester mes tarifs**.
5. **Paramètres → Notifications** : l'email qui reçoit les nouvelles demandes, et les alertes de votre téléphone (notification, petit son).

### 2.6 Envoyer des emails (facultatif)

1. Créez un compte sur [resend.com](https://resend.com), ajoutez et vérifiez votre nom de domaine (quelques enregistrements DNS à copier).
2. Créez une clé d'API, puis chez Netlify : `RESEND_API_KEY` = la clé, `EMAIL_FROM` = par exemple `RNB AUTO <demandes@votre-domaine.fr>`.
3. Relancez la mise en ligne, puis **Paramètres → Notifications → Envoyer un email d'essai**.

Avec les emails : vous recevez chaque nouvelle demande, et le client qui a donné son email reçoit la confirmation avec son lien de suivi. Sans email configuré, rien n'est perdu : chaque demande apparaît dans l'administration (avec une alerte), et le client voit son lien de suivi à l'écran.

### 2.7 Vérifier la mise en ligne

- `https://rnb-auto.netlify.app` : l'accueil s'affiche, les boutons Appeler et WhatsApp fonctionnent.
- `https://rnb-auto.netlify.app/robots.txt` et `/sitemap.xml` : les adresses commencent bien par l'adresse du site (et non `localhost`).
- Faites une demande d'essai sur `/demande`, retrouvez-la dans **Demandes**, puis annulez-la.

### 2.8 Nom de domaine

Netlify → **Domain management → Add a domain** et suivez les indications DNS (HTTPS est activé automatiquement). Mettez ensuite `NEXT_PUBLIC_SITE_URL` à jour avec le nouveau domaine, puis relancez la mise en ligne.

### 2.9 Entretien automatique

L'entretien (`/api/maintenance`) :

- supprime les estimations non suivies d'une demande au bout de 30 jours, et les photos 12 mois après la fin d'une intervention (engagements de la page « Confidentialité ») ;
- nettoie les sessions expirées et les compteurs techniques ;
- actualise le prix du carburant si le mode automatique est activé.

Sur Netlify, **sans rien faire**, il se lance lors des visites de l'administration, au plus toutes les 6 heures. Pour un passage quotidien même sans visite, créez une tâche planifiée gratuite (par exemple sur cron-job.org) qui appelle chaque nuit `https://votre-site/api/maintenance` avec l'en-tête `Authorization: Bearer ` suivi de la valeur de `CRON_SECRET`. Sans le bon secret, l'adresse répond « refusé ».

### 2.10 Mettre à jour le site

Chaque envoi sur la branche choisie du dépôt GitHub est **mis en ligne automatiquement** par Netlify : construction, migrations de la base, puis bascule vers la nouvelle version. En cas d'échec, l'ancienne version reste en ligne. Vos réglages et vos demandes ne sont jamais écrasés.

---

## 3. Autre hébergement : Vercel et Neon

1. Créez un compte sur [vercel.com](https://vercel.com) avec votre compte GitHub, puis **Add New → Project** et importez le dépôt `iyadox/RNB-AUTO`. Ne changez aucun réglage : Vercel lance `npm run vercel-build` (migrations, données de départ, puis construction).
2. **Storage** → créer une base **Neon** (PostgreSQL), **région en Europe** (par exemple Francfort), reliée au projet pour tous les environnements. Vercel ajoute la variable `DATABASE_URL`. Autre fournisseur PostgreSQL (Supabase, Scaleway…) : copiez son adresse dans `DATABASE_URL` (chez Supabase, l'adresse du « Transaction pooler »).
3. **Settings → Environment Variables** : `NEXT_PUBLIC_SITE_URL`, `SETUP_TOKEN`, `CRON_SECRET`, et si besoin `RESEND_API_KEY`, `EMAIL_FROM` (mêmes valeurs qu'en 2.3), puis **Deployments → Redeploy**.
4. Création du compte, premiers réglages, emails : comme en 2.4 à 2.6. Domaine : **Settings → Domains**.
5. Entretien : le fichier `vercel.json` déclare une tâche quotidienne (vers 4 h du matin, heure universelle), protégée par `CRON_SECRET` que Vercel envoie automatiquement.

Si le premier déploiement échoue avec « DATABASE_URL est vide », la base n'est pas encore reliée : reliez-la puis redéployez.

---

## 4. Autre hébergement : Docker

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
  - Pourquoi : le poids des pages (budget G.2 de [09 — Refonte immersive](09-refonte-immersive.md), 40 Ko compressés pour l'accueil) se mesure avec la compression du serveur de production. Sur Netlify et Vercel, rien à faire : les pages sont compressées en brotli quand le navigateur l'accepte.
- Compte administrateur en ligne de commande : `docker compose exec app node dist-scripts/create-admin.cjs --email vous@exemple.fr --name "Votre nom" --password "Votre mot de passe"`.
- Entretien quotidien (facultatif) : `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://votre-domaine.fr/api/maintenance` dans une tâche cron.
- Sauvegardes : `docker compose exec db pg_dump -U rnb rnb > sauvegarde.sql`.

---

## 5. Toutes les variables d'environnement

| Variable | Rôle | Par défaut |
|---|---|---|
| `NETLIFY_DB_URL` | adresse de la base Netlify Database | **fournie automatiquement par Netlify** : ne pas la saisir |
| `DATABASE_URL` | adresse PostgreSQL (`postgres://…`) ; `pglite:./.data/pglite` pour la base locale de développement. `POSTGRES_URL` est aussi accepté. Prioritaire sur `NETLIFY_DB_URL` : ne pas la mettre chez Netlify. | base locale en développement ; obligatoire sur Vercel et Docker |
| `NEXT_PUBLIC_SITE_URL` | adresse publique du site (liens, emails, référencement). Inscrite à la construction : relancer la mise en ligne après un changement. | adresse principale Netlify (`URL`) ou Vercel, sinon `http://localhost:3000` |
| `SETUP_TOKEN` | code de création du premier compte | obligatoire en production |
| `CRON_SECRET` | protège l'adresse d'entretien | entretien lors des visites de l'administration |
| `RESEND_API_KEY`, `EMAIL_FROM` | envoi des emails | pas d'email (demandes visibles dans l'administration) |
| `GEO_PROVIDER` | `auto` (services publics) ou `simulation` (essais hors ligne, **ordinateur local uniquement**) | `auto` : ne pas la mettre chez l'hébergeur |
| `OPENROUTESERVICE_API_KEY` | service d'itinéraires de secours supplémentaire | non utilisé |
| `SEED_COMPANY_PHONE`, `SEED_COMPANY_WHATSAPP`, `SEED_COMPANY_EMAIL`, `SEED_COMPANY_AVAILABILITY` | pré-remplissage à la toute première installation | vides (« À COMPLÉTER ») |
| `POSTGRES_PASSWORD` | Docker uniquement | — |
| `DATABASE_POOL_MAX` | connexions simultanées à PostgreSQL | 5 |
| `ALLOW_GEO_SIMULATION` | autorise la simulation des trajets en production (déconseillé) | non |

Aucun secret n'est jamais écrit dans le code ni dans la base : uniquement dans ces variables.

---

## 6. Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | site en développement sur <http://localhost:3000> |
| `npm run build` puis `npm start` | site en mode production |
| `npm run check` | typage + règles de code + tests (à lancer avant chaque envoi) |
| `npm test` | tests du moteur tarifaire, des réglages, des photos et des parcours serveur |
| `npm run e2e` | parcours complets dans un navigateur (installer d'abord : `npx playwright install chromium`) |
| `npm run db:setup` | migrations + données de départ manquantes (base désignée par `DATABASE_URL`) |
| `npm run db:generate` | nouvelle migration après une modification de `src/server/db/schema.ts` (à recopier dans `netlify/database/migrations`, voir 2.2) |
| `npm run admin:create` | crée ou réinitialise un compte administrateur (utile en cas de mot de passe oublié) |

Les vérifications (typage, lint, tests, construction, parcours dans un navigateur) tournent aussi automatiquement sur GitHub à chaque envoi (`.github/workflows/ci.yml`).

---

## 7. En cas de problème

| Symptôme | Solution |
|---|---|
| Netlify : le site affiche une erreur de base de données | vérifiez qu'aucune variable `DATABASE_URL` ou `POSTGRES_URL` n'a été ajoutée chez Netlify (elle remplacerait la base Netlify), puis relancez la mise en ligne |
| Netlify : `robots.txt` ou le plan du site montrent une mauvaise adresse | corrigez `NEXT_PUBLIC_SITE_URL` (sans `/` à la fin) puis relancez la mise en ligne |
| Vercel : le déploiement échoue avec « DATABASE_URL est vide » | reliez une base Neon au projet (section 3), puis redéployez |
| `/admin/installation` affiche « SETUP_TOKEN n'est pas configurée » | ajoutez la variable (2.3) puis relancez la mise en ligne |
| Impossible de rester connecté (Docker) | le site doit être servi en HTTPS (section 4) |
| Bandeau rouge « Mode simulation des trajets » | retirez `GEO_PROVIDER` des variables de l'hébergeur, puis relancez la mise en ligne |
| Les prix ne s'affichent plus sur le site | **Paramètres → Services externes → Tester le calcul des trajets**. En cas de panne d'un service public, les clients peuvent toujours appeler et envoyer une demande : vous les rappelez avec un prix |
| Pas de notification ni de son sur le téléphone | **Paramètres → Notifications → Alertes sur cet appareil**, puis autorisez les notifications dans le navigateur (voir le [guide de l'administrateur](10-guide-administrateur.md)) |
| Mot de passe oublié | une autre personne ayant accès peut vous donner un nouveau mot de passe (**Paramètres → Accès à l'espace**) ; sinon, depuis un ordinateur : mettre l'adresse de la base de production dans `DATABASE_URL`, puis `npm run admin:create` |
