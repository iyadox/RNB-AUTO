# 07 — Questions ouvertes

> Mis à jour le 04/10/2026. Tant qu'une information manque, le site affiche « À COMPLÉTER » ; tant qu'une décision n'est pas prise, une valeur par défaut raisonnable est appliquée, **modifiable dans l'administration sans toucher au code**.

## A. Informations à fournir avant la mise en ligne

Elles se saisissent dans **Paramètres** (l'accueil de l'administration rappelle ce qui manque).

- [ ] Numéro de téléphone affiché sur le site (*Paramètres → Entreprise*).
- [ ] Numéro WhatsApp, s'il diffère du téléphone.
- [ ] Email de contact.
- [ ] Disponibilité réelle : 24h/24 7j/7, ou horaires précis.
- [ ] Mentions légales : raison sociale, forme juridique, SIRET, directeur de la publication, hébergeur (*Paramètres → Mentions légales*).
- [ ] Position exacte du dépôt à vérifier sur la carte (*Paramètres → Adresse de départ*).
- [ ] Logo et photos réelles de la dépanneuse (le site utilise pour l'instant un logo dessiné et des illustrations).
- [ ] Nom de domaine.
- [x] Hébergement : **Vercel + Neon** recommandés (voir [08 — Installation](08-installation-et-deploiement.md)) ; image Docker disponible pour un serveur à soi.
- [x] Zone : estimation automatique jusqu'à **80 km** du dépôt pour aller chercher le véhicule et **150 km** de transport (*Paramètres → Zone*). Au-delà, le client est invité à être rappelé.

## B. Moteur tarifaire

- [ ] **TVA** : appliqué par défaut : entreprise soumise à la TVA, 20 %, prix saisis TTC (*Mes tarifs → TVA*, mode avancé). À confirmer.
- [ ] **La dépanneuse** : type (plateau, treuil ?), PTAC, charge utile, hauteur (parkings souterrains). Consommation par défaut : 13 L/100 km à vide, 16 L/100 km en charge.
- [x] **Services proposés** : remorquage **et** dépannage sur place (batterie, crevaison…) sont proposés ; chaque situation peut être désactivée.
- [ ] **Autoroutes** : le site demande au client s'il est sur une autoroute et explique que la prise en charge se fait après la sortie. Le message est réglable (*Paramètres → Zone*) ; la liste exacte des voies concernées reste à confirmer.
- [x] **Carburant** : prix manuel par défaut (2,350 €/L) ; mode automatique disponible (médiane des stations autour du dépôt, données officielles).
- [ ] **Clients professionnels** (garages, assurances, sociétés d'assistance) avec des tarifs négociés : non traités pour l'instant.

## C. Décisions de logique tarifaire

Appliquées par défaut, toutes modifiables :

- [x] Base des pourcentages : véhicule et situation sur le prix de base ; nuit, jours et fériés sur la prestation complète.
- [x] Dimanche et jour férié le même jour : seule la majoration la plus élevée.
- [x] Nuit et dimanche (ou férié) : **non cumulés**, la plus élevée s'applique. *Le cadrage proposait de les additionner ; le non-cumul a été retenu pour garder des prix abordables. Réglage : « La nuit s'ajoute-t-elle au dimanche ou à un jour férié ? ».*
- [x] Pourcentages additionnés, jamais multipliés entre eux (quand le cumul est activé).
- [x] Arrondi appliqué avant le prix minimum, pour que le minimum soit respecté exactement.
- [x] Heure prise en compte pour les majorations : heure de la demande.
- [x] Estimation en ligne non rentable : prix relevé automatiquement au seuil, avec alerte.
- [x] Remise manuelle sous le prix minimum : autorisée, avec avertissement.
- [x] Nom des suppléments montré au client, sans leur montant.
- [x] Durée de validité d'une estimation en ligne : 30 minutes.
- [ ] Afficher au client l'heure d'arrivée estimée de la dépanneuse : non affichée (engagement commercial à décider).
- [ ] Frais en cas d'annulation après le départ de la dépanneuse : aucun pour l'instant (décision commerciale).
- [ ] Page « Comment est calculé votre prix » : non créée ; l'accueil montre un exemple de prix (désactivable dans *Paramètres → Site internet*).

## D. Avant la mise en ligne

- [ ] Conditions d'intervention : la page contient un modèle à faire valider par un professionnel.
- [ ] Moyens de paiement acceptés (à indiquer dans les conditions d'intervention).
- [ ] Qui reçoit les nouvelles demandes par email (*Paramètres → Notifications*), et clé Resend (voir [08](08-installation-et-deploiement.md)).
- [ ] Fiche Google Business : essentielle pour apparaître sur « dépannage Bobigny ».
- [ ] Textes de sécurité de la branche autoroute, à relire.
