import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../../lib/supabaseClient";

const logIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.logoText}>Scran</Text>
        <Text style={styles.title}>Welcome back!</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="email@domain.com"
          placeholderTextColor="#C4C4C4"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#C4C4C4"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          onChangeText={(text) => setPassword(text)}
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={signInWithEmail}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.secondaryText}>
        Don't have an account?{" "}
        <Text
          onPress={() => router.navigate("/(auth)/signUp")}
          style={styles.linkText}
        >
          Sign up
        </Text>
      </Text>
    </KeyboardAvoidingView>
  );
};
export default logIn;

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#FFF5F9", // Pastel Pink
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontFamily: "SemiBold",
    color: "#8CD9B1",
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontFamily: "Regular",
    color: "#8CD9B1", // Matching the green theme
    fontSize: 18,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#FFFFFF", // Pure white input
    borderRadius: 12, // Rounded corners like image
    height: 55,
    paddingHorizontal: 20,
    color: "#333", // Dark text
    fontFamily: "Regular",
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 0, // Removing border for cleaner look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: "#8CD9B1", // Mint Green
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#8CD9B1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 18,
  },
  secondaryText: {
    fontFamily: "Regular",
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    marginTop: 25,
  },
  linkText: {
    fontFamily: "SemiBold",
    color: "#8CD9B1",
  },
});