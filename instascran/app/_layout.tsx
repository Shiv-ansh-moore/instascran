// app/_layout.tsx
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments, Href } from "expo-router"; // <--- 1. Import Href
import { useContext, useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthProvider, { AuthContext } from "../providers/AuthProvider";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, profile } = useContext(AuthContext);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session) {
      if (!inAuthGroup) {
        router.replace("/(auth)" as Href);
      }
    } else if (!profile) {
      router.replace("/(profileSetUp)" as Href);
    } else {
      if (segments[0] !== "(tabs)") {
        router.replace("/(tabs)" as Href);
      }
    }
  }, [loading, session, profile, router, segments]);

  if (loading) return <Text style={styles.loading}>Loading...</Text>;

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loading: { fontSize: 60, color: "white" },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({

  });

  return (
    <SafeAreaView style={styles.container}>
      <AuthProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(profileSetUp)" />
            </Stack>
          </AuthGate>
      </AuthProvider>
    </SafeAreaView>
  );
}