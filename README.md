# RNB AUTO

Site et espace de gestion de **RNB AUTO** — dépannage, remorquage et assistance, 145 rue de Paris, 93000 Bobigny.

- **Site client**, conçu d'abord pour le téléphone : appeler, écrire sur WhatsApp, ou obtenir une **estimation en ligne** et demander un dépannage en moins de deux minutes.
- **Espace de gestion** : demandes, saisie d'une demande pendant un appel, et réglage de **tous** les paramètres de prix sans aucune connaissance technique.

**Philosophie : très puissant derrière, extrêmement simple devant.**

> **État au 04/10/2026 :** phases 1 à 6 réalisées (voir la [feuille de route](docs/06-feuille-de-route.md)), ainsi que le traitement complet des demandes, les paramètres, les photos et l'entretien automatique.
> Le site est prêt à être mis en ligne : il reste à renseigner les informations de l'entreprise (téléphone, WhatsApp, mentions légales…), qui s'affichent « À COMPLÉTER » tant qu'elles manquent.

## Démarrage rapide

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:3000 — administration : /admin
```

La base locale se crée toute seule. **Mise en ligne (Vercel + Neon, ou Docker) : [guide d'installation](docs/08-installation-et-deploiement.md).**

## Ce que contient le site

### Site public

- Accueil animé (motion design au défilement, sans ralentir le parcours d'urgence ; respecte la préférence « moins d'animations »).
- Pages Dépannage, Remorquage, Zones d'intervention, Panne sur autoroute, Questions fréquentes, L'entreprise, Contact, Mentions légales, Confidentialité, Conditions d'intervention.
- Barre d'action permanente sur téléphone : **Appeler**, **WhatsApp** (message pré-rempli), **Demande** — de simples liens qui fonctionnent sans JavaScript.
- Parcours de demande : position du téléphone ou adresse, cas particulier de l'autoroute, destination ou dépannage sur place, véhicule, problème, **prix estimé calculé par le serveur**, coordonnées, puis **photos facultatives** (réduites sur le téléphone, métadonnées et position GPS retirées).
- Référencement : métadonnées, plan du site, données structurées, image de partage.

### Espace de gestion (`/admin`)

| Écran | Rôle |
|---|---|
| Accueil | demandes en attente, en cours, du jour ; liste « Pour démarrer » |
| Demandes | filtres, recherche, appel en un geste ; fiche complète : gros bouton d'étape suivante, Google Maps / Waze, ajustements avec motif, prix confirmé, recalcul (nouvelle révision), photos, notes internes, historique |
| Nouvelle demande | un client appelle : calcul du prix à annoncer, puis enregistrement de la demande |
| Mes tarifs | tous les réglages de prix, en mode simple ou avancé, avec aperçu de l'effet sur des trajets types avant d'enregistrer |
| Tester mes tarifs | simulateur : trajets, carburant, usure, suppléments, coût pour l'entreprise, prix final, marge ; « essai sans enregistrer » avec comparaison |
| Historique des tarifs | chaque version des tarifs, qui l'a créée, retour à une version précédente |
| Paramètres | entreprise, site, mentions légales, notifications, adresse du dépôt (vérifiée sur une carte), zone, calcul des trajets, mon compte, services externes |

## Tarifs de départ

Les valeurs installées au départ sont des **moyennes du marché francilien (octobre 2026)**, choisies pour donner des prix « normaux ». Ce ne sont pas des tarifs officiels : tout se modifie dans **Mes tarifs**, sans toucher au code.

| Élément | Valeur de départ |
|---|---|
| Forfait remorquage / dépannage sur place | 75 € / 55 € |
| Prix au km : aller à vide / véhicule chargé / retour à vide | 1,00 € / 2,20 € / 0,50 € |
| Nuit (22 h – 6 h), dimanche, jours fériés | + 25 % (la majoration la plus élevée s'applique, sans cumul) |
| Suppléments véhicule | SUV + 15 €, 4x4 + 20 €, utilitaire + 25 €, petit fourgon + 30 €, grand fourgon + 50 € (sur demande) |
| Prix minimum d'une intervention | 45 € |
| Arrondi | aux 5 € les plus proches |
| Gazole | 2,350 €/L (prix manuel ; mode automatique disponible) |

Exemples obtenus (vérifiés par les tests) : remorquage d'une citadine en semaine, 6 km d'approche et 10 km avec le véhicule, **105 €** ; batterie sur place à 4 km du dépôt, **60 €**.

## Organisation du code

```
src/
├── app/                  pages et routes (Next.js 16)
│   ├── (public)/         site public
│   ├── admin/            espace de gestion (chaque page et chaque action vérifie la session)
│   └── api/              adresses, photos, entretien
├── core/                 logique pure, sans base ni réseau
│   ├── pricing/          moteur tarifaire (étapes déclarées dans pipeline.ts, entièrement testé)
│   ├── settings/         registre des réglages : libellés, aides, unités, bornes, niveaux
│   ├── calendar/         heure de Paris, jours fériés
│   └── quotes/           schémas de validation partagés navigateur / serveur
├── server/               accès base, itinéraires, carburant, demandes, photos, sécurité
└── components/           interface (site public, administration, identité visuelle)
drizzle/                  migrations SQL
scripts/                  migrations, données de départ, création d'un compte administrateur
tests/e2e/                parcours complets dans un navigateur (Playwright)
docs/                     documents du projet
```

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | site en développement |
| `npm run check` | typage, règles de code et tests |
| `npm run e2e` | parcours complets dans un navigateur |
| `npm run build` / `npm start` | construction et lancement en mode production |
| `npm run db:setup` | migrations + données de départ manquantes |
| `npm run admin:create` | créer ou réinitialiser un compte administrateur |

## Documents

| N° | Document | Contenu |
|---|---|---|
| 01 | [Vision, pages et parcours](docs/01-vision-et-parcours.md) | périmètre, pages publiques et admin, parcours client, parcours d'une intervention |
| 02 | [Architecture technique](docs/02-architecture-technique.md) | technologies, structure du code, intégrations et solutions de repli, sécurité, RGPD |
| 03 | [Moteur tarifaire](docs/03-moteur-tarifaire.md) | trois trajets, ordre des étapes, règles, coûts internes, marge, arrondi, minimum, photographies |
| 04 | [Modèle de données](docs/04-modele-de-donnees.md) | tables et principaux champs |
| 05 | [Réglages administrables](docs/05-reglages-administrables.md) | registre des réglages, mode simple / avancé, vocabulaire |
| 06 | [Feuille de route](docs/06-feuille-de-route.md) | phases, ce qui est fait, la suite |
| 07 | [Questions ouvertes](docs/07-questions-ouvertes.md) | informations à fournir et décisions appliquées par défaut |
| 08 | [Installation et mise en ligne](docs/08-installation-et-deploiement.md) | essai local, Vercel + Neon, Docker, variables, dépannage |

Les règles à respecter pour toute contribution sont dans [CLAUDE.md](CLAUDE.md).
