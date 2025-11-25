import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  View,
  StyleSheet, // <<< IMPORT
  TouchableOpacity, // <<< IMPORT
  ActivityIndicator, // <<< IMPORT
  KeyboardAvoidingView, // <<< IMPORT
  Platform, // <<< IMPORT
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
      <Text style={styles.title}>Welcome Back</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input} // <<< STYLE
          placeholder="Enter your email"
          placeholderTextColor="rgba(255,255,255,0.5)" // <<< STYLE
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          style={styles.input} // <<< STYLE
          placeholder="Enter your password"
          placeholderTextColor="rgba(255,255,255,0.5)" // <<< STYLE
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          onChangeText={(text) => setPassword(text)}
        />
      </View>

      {/* <<< REPLACED <Button> WITH <TouchableOpacity> >>> */}
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
          onPress={() => {
            router.navigate("/(auth)/signUp"); // <<< Assumed route name
          }}
          style={styles.linkText} // <<< STYLE
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
    padding: 20,
    backgroundColor: "#171717", // <<< Core background
  },
  title: {
    fontFamily: "SemiBold", // <<< Custom font
    color: "white",
    fontSize: 32,
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#242424", // <<< Secondary background
    borderColor: "rgba(77, 61, 61, 0.50)", // <<< Signature border
    borderWidth: 1,
    borderRadius: 20, // <<< Rounded corners
    height: 50,
    paddingHorizontal: 20,
    color: "white", // <<< Text color
    fontFamily: "Regular", // <<< Custom font
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#3ECF8E", // <<< Primary accent
    width: "100%",
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontFamily: "Regular", // <<< Custom font
    color: "white",
    fontSize: 18,
  },
  secondaryText: {
    fontFamily: "Regular", // <<< Custom font
    color: "#AAAAAA", // <<< Secondary text color
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  linkText: {
    fontFamily: "Regular", // <<< Custom font
    color: "#3ECF8E", // <<< Primary accent
    fontSize: 16,
  },
});