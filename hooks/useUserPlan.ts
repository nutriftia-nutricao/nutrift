import { useEffect } from "react";
import { fetchUserProfile } from "../services/user";
import { useUserStore } from "../stores/useUserStore";

type UserWithPlanMeta = {
  plan?: "free" | "pro" | "trial" | string;
  trial_ends_at?: string | null;
  last_plan_generated_at?: string | null;
};

/** Estado do store usado nos seletores (apenas user). */
type UserStoreSlice = { user: UserWithPlanMeta | null };

/**
 * Retorna true se o usuário tem acesso Pro ativo (plano pro ou trial válido).
 * Sempre re-busca o perfil do banco na primeira chamada para garantir dados frescos.
 */
export const useIsPro = (): boolean => {
  const user = useUserStore((state: UserStoreSlice) => state.user) as UserWithPlanMeta | null;

  // Garante que o perfil do banco sobrescreve o cache local ao montar
  useEffect(() => {
    const storedUser = useUserStore.getState().user as (UserWithPlanMeta & { id?: string }) | null;
    if (!storedUser?.id) return;
    fetchUserProfile(storedUser.id).then((fresh) => {
      if (fresh) useUserStore.getState().setUser(fresh);
    });
  }, []);

  if (!user) return false;
  if (user.plan === "pro" || user.plan === "ultra") return true;
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
  const user = useUserStore((state: UserStoreSlice) => state.user) as UserWithPlanMeta | null;
  if (!user?.last_plan_generated_at) return 0;
  const lastGen = new Date(user.last_plan_generated_at);
  const daysSince = Math.floor((Date.now() - lastGen.getTime()) / 86400000);
  return Math.max(0, 7 - daysSince);
};
