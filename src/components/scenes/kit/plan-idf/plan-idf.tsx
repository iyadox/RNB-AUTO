/**
 * Point d'entrée du « Plan RNB » (docs/09, B.7, E.4, E.7, F.3).
 * - `PlanIdf` : le composant (client, voir `plan-idf-view.tsx` pour ses options) ;
 * - `PLAN_SIZE`, `planPoint`, `resolveDepotPosition` : outils purs du repère, utilisables dans
 *   les composants serveur (ce module n'est PAS un module client).
 */
export { PLAN_SIZE, planPoint, resolveDepotPosition } from "./plan-geometry";
export { PlanIdf, type PlanIdfProps } from "./plan-idf-view";
