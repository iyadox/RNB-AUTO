# 06 — Feuille de route

> Document de cadrage du 03/10/2026, mis à jour le 04/10/2026 avec l'état d'avancement.

## État au 04/10/2026

| Phase | État | Détail |
|---|---|---|
| 1 — Fondations | ✅ fait | application Next.js, base PostgreSQL (PGlite en local), registre des réglages, connexion sécurisée, journal, identité visuelle, vérifications automatiques sur GitHub |
| 2 — Site public | ✅ fait | toutes les pages, motion design, barre d'action mobile, référencement |
| 3 — Itinéraires | ✅ fait | IGN + secours (Photon, OSRM, OpenRouteService), cache, coupe-circuit, mode simulation hors ligne |
| 4 — Moteur tarifaire | ✅ fait | chaîne d'étapes, coûts internes, marge, arrondi, minimum, TVA, photographies ; estimation dans le parcours client |
| 5 — Administration des tarifs | ✅ fait | « Mes tarifs » simple / avancé, aperçu d'impact, historique, retour en arrière |
| 6 — Simulateur | ✅ fait | « Tester mes tarifs » (détail complet, essai sans enregistrer, trajets types) et « Nouvelle demande » pendant un appel |
| 7 — Demandes d'intervention | 🟡 en grande partie | fait : photos, branche autoroute, fiche complète (statuts, ajustements, révisions, journal, notes), email à chaque demande. Reste : notifications instantanées sur téléphone (Web Push, SMS) |
| 8 — Tableau de bord et historique | 🟡 en partie | fait : accueil du jour, liste filtrable, recherche. Reste : statistiques par période, export, fiches clients |
| 9 — Carburant automatique | 🟡 en grande partie | fait : source officielle, médiane autour du dépôt, contrôles de vraisemblance, replis, « Actualiser maintenant », actualisation quotidienne. Reste : choix d'une station habituelle |
| 10 — Améliorations | à prioriser | voir la liste ci-dessous |

Les valeurs de départ des tarifs sont des **moyennes du marché francilien** (et non des valeurs « DÉMO ») : le site peut être mis en ligne dès que les informations de l'entreprise sont renseignées (voir [08 — Installation](08-installation-et-deploiement.md)).

## Ordre proposé

L'ordre proposé dans le cahier des charges est conservé, avec quatre ajustements :

| Ajustement | Pourquoi |
|---|---|
| **Phase 1** comprend aussi la connexion admin, le journal des modifications et les maquettes des écrans clés | la sécurité et la traçabilité doivent exister avant le premier écran d'admin ; les maquettes permettent de valider l'ergonomie avant de coder |
| **Phase 2** comprend un formulaire de demande simple, sans prix | le site peut être mis en ligne tôt et être utile tout de suite. C'est important, car le référencement Google met des mois à se construire |
| **Phases 3 et 4** se terminent ensemble par l'estimation dans le parcours client | l'itinéraire seul n'a pas de valeur pour le client ; le moteur, lui, peut être développé en parallèle puisqu'il ne dépend de rien |
| **Phase 6** comprend la saisie d'une demande pendant un appel | elle réutilise entièrement le simulateur, et beaucoup de clients appelleront plutôt que de remplir le formulaire |

## Phases

### Phase 1 — Fondations : architecture, base de données, design général

Livrables :

- dépôt organisé (`src/core`, `src/server`, `src/app`), outils de qualité, vérifications automatiques à chaque modification ;
- base de données : tables du cœur (réglages, règles, versions de tarifs, journal, utilisateurs, interventions, estimations) et migrations ;
- registre des réglages et données de départ (moyennes du marché francilien) ;
- connexion admin sécurisée et squelette de l'admin (menu, pages vides) ;
- identité visuelle : palette, typographies, composants de base (bouton d'action, tuile, interrupteur, champs €, % et heure, carte de réglage) ;
- maquettes mobiles des écrans clés (accueil, parcours de demande, « Mes tarifs », fiche intervention), à valider ;
- environnement de préproduction.

Terminé quand : on se connecte à l'admin, les réglages de départ sont en base et les écrans clés sont validés.

### Phase 2 — Site public

Livrables :

- toutes les pages publiques ; barre d'action mobile (Appeler, WhatsApp, Demande) ; message WhatsApp pré-rempli ;
- formulaire de demande simple (sans prix), enregistré en base, avec email à RNB AUTO ;
- référencement : balises, plan du site, données structurées, pages des zones d'intervention ;
- performance (score mobile ≥ 90), accessibilité, pages légales (contenus à fournir).

Terminé quand : le site peut être mis en ligne, et une personne en panne peut appeler, écrire ou envoyer une demande.

### Phase 3 — Calcul d'itinéraire

Livrables :

- géocodage : suggestions d'adresses, position GPS → adresse ;
- calcul des 3 trajets ; deux fournisseurs avec bascule automatique ; cache ; suivi de l'état des services ;
- jeu de trajets de test en Île-de-France.

Terminé quand : n'importe quelle adresse d'Île-de-France donne ses 3 trajets, et la panne du fournisseur principal bascule automatiquement sur le secours.

### Phase 4 — Moteur tarifaire

Livrables :

- chaîne d'étapes, règles, coûts internes, marge, arrondi, minimum, TVA ;
- photographies et versions de tarifs ;
- tests complets (scénarios de référence, cas limites) ;
- estimation affichée dans le parcours client (désactivable).

Terminé quand : le parcours client affiche une estimation calculée par le serveur et reproductible à l'identique depuis sa photographie.

### Phase 5 — Administration des tarifs

Livrables :

- « Mes tarifs » en mode simple et avancé, construit à partir du registre ;
- confirmation avec aperçu d'impact, historique, retour à une version précédente ;
- écran « Vos tarifs sont-ils prêts ? ».

Terminé quand : chaque valeur utilisée par le moteur se modifie dans l'admin, sans code, avec historique.

### Phase 6 — Simulateur administrateur

Livrables :

- « Tester mes tarifs » : détail complet, essai sans enregistrer, comparaison, trajets de référence ;
- « Nouvelle demande (appel) ».

Terminé quand : l'admin teste n'importe quel scénario et crée une demande pendant un appel téléphonique.

### Phase 7 — Demandes d'intervention

Livrables :

- parcours complet : photos, branche autoroute, coordonnées, récapitulatif ;
- fiche intervention : statuts, ajustements, révisions, journal ;
- notifications instantanées (téléphone et email).

Terminé quand : une demande passe de « Nouvelle » à « Terminée » entièrement depuis le téléphone de l'admin.

### Phase 8 — Tableau de bord et historique

Livrables : tableau de bord (jour, semaine, mois, année), recherche multicritère, export, fiches clients.

Terminé quand : les chiffres affichés sont justes et vérifiables intervention par intervention.

### Phase 9 — Carburant automatique

Livrables : récupération planifiée depuis la source officielle, médiane autour du dépôt ou station choisie, contrôles de vraisemblance, solutions de repli, bouton « Actualiser maintenant ».

Terminé quand : le prix se met à jour seul, et une panne de la source ne change rien pour le client.

### Phase 10 — Améliorations et automatisations

À prioriser ensemble :

- règles personnalisées créées par l'admin ;
- interrupteur de disponibilité et heure d'arrivée estimée ;
- SMS et WhatsApp automatiques, suivi en direct pour le client ;
- plusieurs dépanneuses et chauffeurs, application chauffeur, position GPS ;
- paiement ; devis et facturation via une plateforme agréée ;
- studio d'animations 9:16 pour TikTok, Instagram Reels et YouTube Shorts.

## Ce qui peut avancer en parallèle

- Le **moteur tarifaire** ne dépend d'aucun écran : il peut être développé et testé pendant les Phases 2 et 3.
- Les **contenus** (textes des pages, photos de la dépanneuse, mentions légales) peuvent être préparés par RNB AUTO pendant la Phase 1.
