import { Redirect } from "expo-router";

// O guard de auth em _layout.tsx cuida do redirect correto (login / onboarding / tabs).
// Este arquivo apenas resolve a rota raiz para evitar "Unmatched Route".
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
