# RNB AUTO

Plateforme de **dépannage, remorquage et assistance** de RNB AUTO, 145 rue de Paris, 93000 Bobigny.

- **Site client**, conçu d'abord pour le téléphone : appeler, écrire sur WhatsApp, ou obtenir une estimation et demander un dépannage en moins de deux minutes.
- **Espace RNB AUTO** : demandes, interventions, statistiques, et réglage de **tous** les paramètres de prix sans connaissance technique.

> **Statut : cadrage.** Aucun code applicatif n'est encore écrit.
> Les documents ci-dessous décrivent la vision, l'architecture et le moteur tarifaire. Ils sont à valider avant la Phase 1.

**Philosophie : très puissant derrière, extrêmement simple devant.**

## Documents de cadrage

| N° | Document | Contenu |
|---|---|---|
| 01 | [Vision, pages et parcours](docs/01-vision-et-parcours.md) | résumé, périmètre, pages publiques et admin, parcours client, parcours d'une intervention |
| 02 | [Architecture technique](docs/02-architecture-technique.md) | stack, structure du code, modules et dépendances, intégrations et solutions de repli, sécurité, RGPD, évolutions |
| 03 | [Moteur tarifaire](docs/03-moteur-tarifaire.md) | trois tronçons, ordre des étapes, règles, coûts internes, marge, arrondi, minimum, photographies, exemples chiffrés |
| 04 | [Modèle de données](docs/04-modele-de-donnees.md) | tables et principaux champs |
| 05 | [Réglages administrables](docs/05-reglages-administrables.md) | garanties « sans code », mode simple / avancé, catalogue des réglages, vocabulaire |
| 06 | [Feuille de route](docs/06-feuille-de-route.md) | phases, livrables, critères de fin |
| 07 | [Questions ouvertes](docs/07-questions-ouvertes.md) | informations manquantes et décisions à valider |

Les règles à respecter pour toute contribution sont dans [CLAUDE.md](CLAUDE.md).

## Structure prévue du dépôt

```
rnb-auto/
├── apps/
│   ├── web/              site public + administration + API (Next.js)
│   └── studio/           (plus tard) animations verticales 9:16 pour les réseaux sociaux
├── packages/
│   ├── pricing-engine/   moteur tarifaire pur : aucune valeur commerciale, entièrement testé
│   ├── db/               schéma, migrations, données de démonstration
│   ├── brand/            identité visuelle partagée (site et vidéos)
│   └── shared/           registre des réglages, validations, vocabulaire français
└── docs/                 documents de cadrage
```
