import type { Href } from "expo-router";
import { Redirect } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "../context/auth";

export default function Index() {
  const auth = useAuth();

  if (!auth || auth.isLoading) return <Text>Loading...</Text>;

  if (!auth.session) {
    return <Redirect href={"/auth/login" as Href} />;
  }

  // Redirect to pairing screen if not paired and hasn't skipped
  if (!auth.profile?.partner_id && !auth.hasSkippedPairing) {
    return <Redirect href={"/auth/couple" as Href} />;
  }

  return <Redirect href={"/(tabs)" as Href} />;
}
