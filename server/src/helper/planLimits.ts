// Limites de chaque formule (colonne user.user_plan). Rejoindre des
// événements reste illimité quelle que soit la formule. Infinity : pas de
// limite (la comparaison au nombre d'éléments ne bloque jamais ; en JSON,
// elle est envoyée comme null).
export type UserPlan = "free" | "premium" | "gold";

export const PLAN_LIMITS: Record<
  UserPlan,
  { hostedEvents: number; galleryPhotos: number; reservations: number }
> = {
  free: { hostedEvents: 2, galleryPhotos: 15, reservations: 10 },
  premium: { hostedEvents: 5, galleryPhotos: 30, reservations: 10 },
  gold: { hostedEvents: Infinity, galleryPhotos: 50, reservations: Infinity },
};

// Une valeur inconnue (ou un utilisateur introuvable) retombe sur la formule
// gratuite plutôt que de lever les limites.
export const getPlanLimits = (plan: string | null | undefined) =>
  PLAN_LIMITS[plan as UserPlan] ?? PLAN_LIMITS.free;
