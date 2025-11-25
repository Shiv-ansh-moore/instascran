// (auth)/index.tsx

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const index = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.navigate("/(auth)/logIn")}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.navigate("/(auth)/signUp")}
      >
        <Text style={styles.secondaryButtonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};
export default index;

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#171717", // Core background
  },
  title: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 32,
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#3ECF8E", // Primary accent
    width: "100%",
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15, // Space between buttons
  },
  buttonText: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 18,
  },
  secondaryButton: {
    backgroundColor: "#242424", // Secondary background
    borderColor: "rgba(77, 61, 61, 0.50)", // Signature border
    borderWidth: 1,
    width: "100%",
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 18,
  },
});