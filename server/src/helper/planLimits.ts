// Limites de chaque formule (colonne user.user_plan). Rejoindre des
// événements reste illimité quelle que soit la formule. Infinity : pas de
// limite (la comparaison au nombre d'événements ne bloque jamais).
export type UserPlan = "free" | "premium" | "gold";

export const PLAN_LIMITS: Record<
  UserPlan,
  { hostedEvents: number; galleryPhotos: number }
> = {
  free: { hostedEvents: 2, galleryPhotos: 15 },
  premium: { hostedEvents: 5, galleryPhotos: 30 },
  gold: { hostedEvents: Infinity, galleryPhotos: 50 },
};

// Réservations par événement : même limite pour toutes les formules.
export const MAX_RESERVATIONS = 10;

// Une valeur inconnue (ou un utilisateur introuvable) retombe sur la formule
// gratuite plutôt que de lever les limites.
export const getPlanLimits = (plan: string | null | undefined) =>
  PLAN_LIMITS[plan as UserPlan] ?? PLAN_LIMITS.free;
