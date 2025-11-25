import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

// Make sure the path matches where you saved the file!
// If using Expo Router default structure:
const logoImage = require("../../assets/images/logo.png"); 
// Or if you kept the long name: require("../../assets/images/Black_White_Bold_Modern_Studio_Logo.png")

const index = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo Image */}
      <View style={styles.logoContainer}>
        <Image 
            source={logoImage} 
            style={styles.logoImage} 
            resizeMode="contain"
        />
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
    justifyContent: "space-between", 
    padding: 30,
    backgroundColor: "#FFEBFE",
    paddingTop: 100,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 280, 
    height: 150, 
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
    backgroundColor: "#8CD9B1", 
    width: "100%",
    height: 55,
    borderRadius: 15, 
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
    backgroundColor: "#FFFFFF", 
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
    color: "#555", 
    fontSize: 18,
  },
});