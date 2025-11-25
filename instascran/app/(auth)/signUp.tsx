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

const signUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    setLoading(true);
    const {
      error,
      data: { session },
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
    if (!session) {
      Alert.alert("Please check your inbox for email verification!");
      router.navigate("/(auth)/logIn");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        {/* Mimic the logo layout */}
        <View style={{ transform: [{ rotate: "-5deg" }], marginBottom: 20 }}>
           <Text style={styles.logoText}>Scran<Text style={styles.subLogoText}>INSTA</Text></Text>
        </View>
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subTitle}>Enter your email to sign up for InstaScran</Text>
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
        onPress={signUpWithEmail}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By clicking continue, you agree to our <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
      </Text>
      
      <Text style={styles.secondaryText}>
        Already have an account?{" "}
        <Text
          onPress={() => {
            router.navigate("/(auth)/logIn");
          }}
          style={styles.linkText}
        >
          Login
        </Text>
      </Text>
    </KeyboardAvoidingView>
  );
};
export default signUp;

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
    marginBottom: 30,
  },
  logoText: {
    fontFamily: "SemiBold",
    color: "#8CD9B1",
    fontSize: 50,
  },
  subLogoText: {
    fontSize: 14,
    color: "#8CD9B1",
  },
  title: {
    fontFamily: "SemiBold",
    color: "#8CD9B1",
    fontSize: 20,
    marginTop: 10,
  },
  subTitle: {
    fontFamily: "Regular",
    color: "#D4A5BD", // Darker pink/grey for subtitle
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  inputContainer: {
    width: "100%",
    marginTop: 20,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 20,
    color: "#333",
    fontFamily: "Regular",
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: "#8CD9B1", // Mint Green
    width: "100%",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#8CD9B1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 18,
  },
  termsText: {
      textAlign: 'center',
      fontSize: 11,
      color: '#888',
      marginTop: 20,
      marginBottom: 30,
      paddingHorizontal: 20,
      lineHeight: 16,
  },
  secondaryText: {
    fontFamily: "Regular",
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  linkText: {
    fontFamily: "SemiBold",
    color: "#8CD9B1", // Mint Green Links
    fontSize: 14,
  },
});