// Limites de chaque formule (colonne user.user_plan). Rejoindre des
// événements reste illimité quelle que soit la formule.
export type UserPlan = "free" | "premium" | "premium_plus";

export const PLAN_LIMITS: Record<
  UserPlan,
  { hostedEvents: number; galleryPhotos: number }
> = {
  free: { hostedEvents: 2, galleryPhotos: 15 },
  premium: { hostedEvents: 5, galleryPhotos: 30 },
  premium_plus: { hostedEvents: 10, galleryPhotos: 50 },
};

// Une valeur inconnue (ou un utilisateur introuvable) retombe sur la formule
// gratuite plutôt que de lever les limites.
export const getPlanLimits = (plan: string | null | undefined) =>
  PLAN_LIMITS[plan as UserPlan] ?? PLAN_LIMITS.free;
