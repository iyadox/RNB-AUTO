# 10 — Guide de l'administrateur

> Version du 24/10/2026. Pour qui gère RNB AUTO au quotidien, depuis le téléphone ou l'ordinateur : l'espace de gestion est à l'adresse du site suivie de `/admin`.
> Mise en ligne et premier compte : [08 — Installation](08-installation-et-deploiement.md). Réglage des prix : « Mes tarifs » (voir [05 — Réglages administrables](05-reglages-administrables.md)).

## 1. L'accueil (tableau de bord)

C'est la première page après la connexion. Elle se **met à jour toute seule** : inutile de la recharger.

- **Quatre compteurs** (touchez-les pour ouvrir la liste correspondante) : **Nouvelles** (à accepter, en jaune quand il y en a), **À rappeler** (clients à recontacter), **En cours** (acceptées ou en route), **Reçues aujourd'hui**.
- **À traiter** : les demandes en attente, avec un bouton pour passer directement à l'étape suivante (« Accepter », « Je pars »…). « Tout voir » ouvre la liste complète.
- **En cours** : les interventions acceptées, en route ou en transport.
- **Chiffre d'affaires** : aujourd'hui, la semaine, le mois et les 7 derniers jours. Il ne compte que les **prix confirmés des interventions terminées** ; les prix déjà confirmés des interventions encore en cours sont indiqués à part.
- **Raccourcis** : « Saisir un appel » (nouvelle demande prise au téléphone), « Tester un prix », « Mes tarifs ».
- **Pour démarrer** : ce qui manque encore (téléphone, mentions légales, dépôt…). Touchez une ligne pour la compléter ; la liste disparaît quand tout est rempli.

## 2. Une demande, du début à la fin

**Demandes** liste toutes les demandes (filtres : à traiter et en cours, nouvelles, à rappeler, toutes… ; recherche par nom, téléphone, ville ou plaque). La fiche d'une demande regroupe le client, le véhicule, les adresses (avec l'itinéraire dans Google Maps), le prix et son détail, les photos et le journal.

Les étapes, dans l'ordre : **Nouvelle demande → Acceptée → Dépanneuse en route → Arrivée sur place → Véhicule chargé → Transport en cours → Terminée** (sans chargement ni transport pour un dépannage sur place). Une demande peut aussi passer **À rappeler** ou **Annulée**. Chaque changement est noté dans le journal, avec qui l'a fait et quand.

Le prix d'une demande ne change jamais tout seul : « Recalculer » crée une nouvelle version et garde l'ancienne.

## 3. Le suivi client (`/suivi`)

Chaque client a une **page personnelle de suivi** : `/suivi/<référence>?t=<code>`. Il y voit en direct :

- l'**étape en cours** (reçue, confirmée, en route, sur place, transport, terminée ou annulée), sur une petite route qui avance ;
- le **prix estimé**, puis le prix confirmé ;
- les boutons **Appeler** et **WhatsApp** ;
- l'**ajout de photos** du véhicule (elles arrivent dans la fiche de la demande) ;
- un bouton pour **partager** le lien (à un proche, à l'assurance).

La page s'actualise toute seule (environ toutes les 20 secondes). Elle n'affiche **aucune donnée personnelle** (ni nom, ni téléphone, ni adresse exacte) et n'est jamais référencée par les moteurs de recherche.

**Comment le client reçoit son lien :**

1. à l'écran « Demande reçue », juste après sa demande sur le site ;
2. par email, s'il a donné son email et si l'envoi d'emails est activé ([08](08-installation-et-deploiement.md), 2.6) ;
3. par vous : dans la fiche de la demande, **« Envoyer le lien de suivi »** prépare un message à envoyer par **WhatsApp**, par **SMS** ou à copier. Utile pour une demande prise au téléphone, ou si le client a perdu son lien. Chaque lien créé est noté dans le journal ; les liens déjà envoyés restent valables.

**Durée :** le lien se ferme **7 jours après la fin** (ou l'annulation) de l'intervention, et au plus tard **60 jours** après la demande. Le client voit alors « Ce suivi est terminé » avec vos coordonnées.

## 4. Le bon d'intervention

Dans la fiche d'une demande : **« Bon d'intervention »**. C'est une page prête à imprimer, à **enregistrer en PDF** (bouton « Imprimer », puis « Enregistrer au format PDF ») ou à **partager** (bouton « Partager » du téléphone).

Il reprend : client, véhicule, intervention (adresses, situation), horaires, prix convenu, observations, et un cadre **« Signature du client »** (précédée de « bon pour accord »). Une information qui manque est marquée **À COMPLÉTER** en rouge : rien n'est inventé.

Ce bon **n'est pas une facture**. Il sert à faire signer le client sur place.

## 5. Accès à l'espace

**Paramètres → Accès à l'espace** : les personnes qui peuvent entrer dans l'espace de gestion. Chacune a **son propre email et son mot de passe** ; ne partagez jamais le vôtre.

- **Donner l'accès à quelqu'un** : nom, email et un mot de passe de départ, à lui transmettre de vive voix. Il pourra le changer dans « Mon compte ».
- **Nouveau mot de passe** : en cas d'oubli, une autre personne ayant accès en donne un nouveau.
- **Suspendre** : la personne ne peut plus entrer et elle est **déconnectée de tous ses appareils**. **Rétablir** lui rend l'accès.
- **Derniers changements** : qui a donné, retiré ou modifié un accès, et quand.

Attention : toute personne ayant accès peut **tout faire** (demandes, tarifs, réglages). Ne donnez l'accès qu'à des personnes de confiance.

**Mon compte → Appareils connectés** : la liste des téléphones, tablettes et ordinateurs connectés à votre compte, avec un pictogramme selon le type d'appareil et la date de connexion. Un téléphone perdu ou un ordinateur partagé ? Touchez **« Déconnecter »** à côté, ou **« Déconnecter les autres appareils »**.

## 6. Notifications et son

Deux façons d'être prévenu d'une nouvelle demande, à régler dans **Paramètres → Notifications** :

1. **Par email** (pour tous les appareils) : l'adresse qui reçoit chaque nouvelle demande, avec un bouton pour l'ouvrir. L'état de l'envoi et les derniers emails sont affichés ; « Envoyer un email d'essai » vérifie que tout marche.
2. **Alertes sur cet appareil** (à régler sur **chaque** téléphone ou ordinateur) :
   - **Notification sur cet appareil** : le téléphone affiche une notification quand une demande arrive, même si l'espace est ouvert en arrière-plan. Le navigateur demande l'autorisation la première fois : répondez « Autoriser ». Si vous avez refusé, il faut l'autoriser dans les réglages du navigateur.
   - **Petit son à chaque nouvelle demande** : deux bips courts.

Dans tous les cas, quand l'espace est ouvert : le nombre de nouvelles demandes s'affiche dans le titre de l'onglet, par exemple « (2) Accueil », et un bandeau « Voir » apparaît à l'arrivée d'une demande. L'espace vérifie toutes les 20 secondes (toutes les minutes en arrière-plan).

Bon à savoir : la notification et le son ne fonctionnent que si l'espace est **ouvert** dans le navigateur (au premier plan ou en arrière-plan). Téléphone éteint ou navigateur fermé : seul l'email prévient. Sur iPhone, Safari n'affiche les notifications d'un site que s'il a été ajouté à l'écran d'accueil (« Partager → Sur l'écran d'accueil ») ; à défaut, gardez le son activé et l'email.

## 7. Bonnes habitudes

- Gardez l'espace ouvert sur le téléphone de permanence, avec le son activé.
- Après une modification de tarifs, vérifiez un prix dans **Tester mes tarifs**.
- Une fois par mois, regardez **Paramètres → Services externes** : chaque service doit être au vert.
- Une panne d'un service extérieur (itinéraires, carburant, emails) n'empêche jamais un client d'appeler ni d'envoyer sa demande : elle arrive dans l'espace, et vous le rappelez avec un prix.
