import { useUserStore } from "@/stores/useUserStore";

type UserWithPlanMeta = {
  plan?: "free" | "pro" | "trial" | string;
  trial_ends_at?: string | null;
  last_plan_generated_at?: string | null;
};

/**
 * Retorna true se o usuário tem acesso Pro ativo (plano pro ou trial válido).
 */
export const useIsPro = (): boolean => {
  const user = useUserStore((state) => state.user) as UserWithPlanMeta | null;
  if (!user) return false;
  if (user.plan === "pro") return true;
  if (user.plan === "trial" && user.trial_ends_at) {
    return new Date() < new Date(user.trial_ends_at);
  }
  return false;
};

/**
 * Quantos dias faltam para poder regenerar o plano manualmente.
 * Retorna 0 se pode regenerar agora.
 */
export const usePlanDaysRemaining = (): number => {
  const user = useUserStore((state) => state.user) as UserWithPlanMeta | null;
  if (!user?.last_plan_generated_at) return 0;
  const lastGen = new Date(user.last_plan_generated_at);
  const daysSince = Math.floor((Date.now() - lastGen.getTime()) / 86400000);
  return Math.max(0, 7 - daysSince);
};
