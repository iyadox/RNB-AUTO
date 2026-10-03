# Règles du projet RNB AUTO

Lire `README.md` et les documents de `docs/` avant toute modification importante.
Les décisions encore en attente sont listées dans `docs/07-questions-ouvertes.md`.

## Périmètre et contenu

- Site de **dépannage, remorquage et assistance**. Ne jamais en faire un site de vente de véhicules.
- Le contenu présente uniquement l'entreprise RNB AUTO. Aucune information personnelle sur ses dirigeants, nulle part : site, code, commentaires, données, textes.
- Ne jamais inventer d'informations de contact ou légales (téléphone, SIRET, horaires…). Utiliser un marqueur visible « À COMPLÉTER ».

## Tarifs

- **Aucune valeur commerciale en dur dans le code** : prix, pourcentages, horaires, consommation, adresse du dépôt, etc. Tout vient de la base de données et se modifie dans l'administration.
- Les valeurs initiales sont des **valeurs de démonstration**, marquées « DÉMO ». Ce ne sont jamais des tarifs officiels.
- Tout nouveau réglage est déclaré dans le **registre des réglages** (`packages/shared`) avec son libellé français, son aide, son unité, ses bornes et son niveau (simple/avancé). Un réglage absent du registre n'existe pas.
- Le moteur tarifaire (`packages/pricing-engine`) est **pur** : aucun accès base ni réseau, même entrée = même sortie, entièrement testé. L'ordre des étapes est déclaré à un seul endroit.
- Le prix est calculé **uniquement côté serveur**. Le navigateur n'envoie que des choix, jamais un montant.
- Montants en **centimes entiers** (`_cents`), prix du carburant en millièmes d'euro (`_millis`), pourcentages en points de base (`_bp`, 1 % = 100). Fuseau horaire `Europe/Paris`.
- Une estimation enregistrée garde sa **photographie** (entrées, contexte, version des tarifs, résultat). Elle n'est jamais recalculée automatiquement : un recalcul crée une nouvelle révision.
- Toute modification de réglage est journalisée : qui, quand, ancienne valeur, nouvelle valeur.

## Services externes

- Toujours passer par un adaptateur (`RoutingProvider`, `GeocodingProvider`, `FuelPriceProvider`, `Notifier`…), avec délai maximal et solution de repli.
- Une panne externe ne doit jamais empêcher un client d'appeler ni d'envoyer une demande.

## Interface

- Mobile d'abord, pour le site public **et** pour l'administration.
- Les boutons Appeler et WhatsApp sont de simples liens qui fonctionnent sans JavaScript.
- Administration en français simple. Ne jamais afficher un nom technique : pas `minimumFare`, mais « Prix minimum d'une intervention ».
- Test des 3 secondes : une personne qui ne connaît rien à l'informatique doit comprendre chaque bouton en 3 secondes. Sinon, simplifier.
- Les animations ne ralentissent jamais le parcours d'urgence et respectent la préférence « moins d'animations ».

## Sécurité

- Vérifier la session et les droits dans **chaque** action serveur et route, pas seulement à l'entrée des pages.
- Valider toutes les entrées côté serveur avec les schémas partagés.
- Aucun secret dans le code ni en base : variables d'environnement uniquement.

## Langue

- Interface et documentation en français.
- Identifiants de code en anglais, commentaires en français.
