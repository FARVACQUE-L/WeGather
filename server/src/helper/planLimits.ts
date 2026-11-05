export type UserPlan = "free" | "premium" | "gold";

export const PLAN_LIMITS: Record<
  UserPlan,
  { hostedEvents: number; galleryPhotos: number; reservations: number }
> = {
  free: { hostedEvents: 2, galleryPhotos: 15, reservations: 10 },
  premium: { hostedEvents: 5, galleryPhotos: 30, reservations: 10 },
  gold: { hostedEvents: Infinity, galleryPhotos: 50, reservations: Infinity },
};

export const getPlanLimits = (plan: string | null | undefined) =>
  PLAN_LIMITS[plan as UserPlan] ?? PLAN_LIMITS.free;
