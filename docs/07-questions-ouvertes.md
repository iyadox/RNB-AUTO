# 07 — Questions ouvertes

> Document de cadrage, version 0.1 du 03/10/2026.
> Cocher et compléter au fur et à mesure des réponses. Tant qu'une réponse manque, le système utilise une valeur de démonstration réglable, ou un marqueur « À COMPLÉTER ».

## A. Pour démarrer (Phases 1 et 2)

- [ ] Numéro de téléphone affiché sur le site.
- [ ] Numéro WhatsApp (le même ?).
- [ ] Email de contact.
- [ ] Disponibilité réelle : 24h/24 7j/7, ou horaires précis ?
- [ ] Logo et couleurs existants ? Photos réelles de la dépanneuse ?
- [ ] Nom de domaine déjà réservé ?
- [ ] Hébergement : des connecteurs Supabase, Netlify, Resend, Twilio et Stripe sont configurés sur le compte. Faut-il utiliser des comptes existants, ou une solution complète est-elle à proposer ?
- [ ] Zone visée : communes et départements, distance maximale pour une estimation automatique.

## B. Pour le moteur tarifaire

- [ ] **TVA** : RNB AUTO facture-t-elle la TVA ? Les prix saisis seront-ils TTC ?
- [ ] **La dépanneuse** : type (plateau, treuil ?), PTAC (3,5 t ou plus ?), charge utile, hauteur (parkings souterrains), carburant, consommation approximative à vide et en charge.
- [ ] **Services proposés** : dépannage sur place (batterie, roue…) ou remorquage uniquement ? Deux-roues ? Garde du véhicule au dépôt ?
- [ ] **Autoroutes** : quelles voies exactement sont exclues pour RNB AUTO (autoroutes à péage, autoroutes urbaines comme l'A1, l'A3 ou l'A86, boulevard périphérique, voies rapides) ? En Île-de-France, les règles diffèrent selon les voies. La liste et les messages seront réglables, mais la liste de départ doit venir de RNB AUTO.
- [ ] **Carburant** : faites-vous le plein dans une station habituelle (son prix exact peut être suivi) ? Sinon : moyenne des stations autour du dépôt.
- [ ] **Clients professionnels** (garages, assurances, sociétés d'assistance) avec des tarifs négociés, aujourd'hui ou plus tard ?

## C. Décisions de logique tarifaire

Proposition par défaut entre parenthèses. Tout restera modifiable dans l'admin.

- [ ] Base des pourcentages : véhicule et situation sur le prix de base ; nuit, jours et fériés sur la prestation complète *(proposé)*.
- [ ] Dimanche et jour férié le même jour : seule la majoration la plus élevée *(proposé)*.
- [ ] Nuit et dimanche (ou férié) : les majorations s'additionnent *(proposé)*.
- [ ] Pourcentages non multipliés entre eux : +20 % et +20 % font +40 % *(proposé)*.
- [ ] Arrondi appliqué avant le prix minimum, pour que le minimum soit respecté exactement *(proposé)*.
- [ ] Heure prise en compte pour les majorations : heure de la demande *(proposé)*, ou heure d'arrivée estimée.
- [ ] Estimation en ligne non rentable : relever automatiquement le prix au seuil, avec alerte *(proposé)* ; ou alerte seule ; ou pas de prix affiché.
- [ ] Remise manuelle sous le prix minimum : autorisée avec avertissement *(proposé)*.
- [ ] Afficher au client l'heure d'arrivée estimée de la dépanneuse ? (aucune proposition : c'est un engagement commercial)
- [ ] Afficher au client le nom des suppléments, sans leur montant *(proposé : oui)*.
- [ ] Durée de validité d'une estimation en ligne : 30 minutes *(proposé)*.
- [ ] Annulation après le départ de la dépanneuse : frais ou non ? (aucune proposition : décision commerciale)
- [ ] Page « Comment est calculé votre prix » sur le site : oui ou non ?

## D. Avant la mise en ligne

- [ ] Raison sociale, forme juridique, SIRET, adresse du siège, directeur de la publication (mentions légales).
- [ ] Conditions d'intervention : un projet peut être préparé, à faire valider par un professionnel.
- [ ] Moyens de paiement acceptés.
- [ ] Qui reçoit les nouvelles demandes, et sur quel téléphone ?
- [ ] Fiche Google Business existante ? Elle est essentielle pour apparaître sur « dépannage Bobigny ».
- [ ] Textes de sécurité et d'explication pour la branche autoroute, à valider.
