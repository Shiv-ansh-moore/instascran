import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const index = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Mimicking the Logo from the screenshot */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Scran</Text>
        <Text style={styles.subLogoText}>INSTA</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.tagline}>Discover new food.</Text>

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
    </View>
  );
};
export default index;

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between", // Spacing elements out
    padding: 30,
    backgroundColor: "#FFF5F9", // Pastel Pink Background
    paddingTop: 100,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: "center",
    transform: [{ rotate: "-5deg" }], // Slight tilt like the screenshot
  },
  logoText: {
    fontFamily: "SemiBold", // Ensure this font is loaded, ideally a rounded font
    color: "#8CD9B1", // Mint Green
    fontSize: 60,
    lineHeight: 70,
  },
  subLogoText: {
    fontFamily: "Regular",
    color: "#8CD9B1",
    fontSize: 18,
    position: "absolute",
    right: -10,
    top: 10,
  },
  contentContainer: {
    width: "100%",
  },
  tagline: {
    textAlign: "center",
    color: "#888",
    marginBottom: 30,
    fontSize: 16,
    fontFamily: "Regular",
  },
  button: {
    backgroundColor: "#8CD9B1", // Mint Green Button
    width: "100%",
    height: 55,
    borderRadius: 15, // Soft rounded corners
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#8CD9B1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 18,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF", // White for secondary
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  secondaryButtonText: {
    fontFamily: "SemiBold",
    color: "#555", // Dark grey text
    fontSize: 18,
  },
});