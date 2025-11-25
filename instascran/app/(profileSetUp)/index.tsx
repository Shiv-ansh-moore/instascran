import { useContext, useState } from "react";
import {
  Alert,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  ScrollView,
  Image as RNImage,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "../../lib/supabaseClient";
import { AuthContext } from "../../providers/AuthProvider";

interface ImageData {
  base64: string;
  mimeType: string;
}

const CreateProfile = () => {
  const { session, refreshProfile } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // --- Image Picker Logic ---
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        if (asset.uri && asset.base64 && asset.mimeType) {
          setImageUri(asset.uri);
          setImageData({ base64: asset.base64, mimeType: asset.mimeType });
        }
      }
    } catch (error) {
      Alert.alert("Error picking image", "Please try again.");
    }
  };

  // --- Create Account Logic ---
  async function makeAccount() {
    if (loading) return;
    if (!session?.user.id) return;

    // Basic validation
    if (!username || username.length < 3) {
      Alert.alert("Validation", "Username must be at least 3 characters.");
      return;
    }

    setLoading(true);

    try {
      let avatarPath = null;

      if (imageData) {
        const fileExt = imageData.mimeType.split("/").pop();
        const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, decode(imageData.base64), {
            contentType: imageData.mimeType,
            upsert: true,
          });

        if (uploadError) throw uploadError;
        avatarPath = filePath;
      }

      const updates = {
        id: session.user.id,
        username: username,
        full_name: fullName,
        avatar_url: avatarPath,
        bio: bio,
        website: website,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      } else {
        console.log("Profile created successfully!");
        await refreshProfile();
      }
    } catch (error: any) {
      console.error("Error creating profile:", error);
      if (error.code === "23505") {
        Alert.alert("Username already taken", "Please choose another username.");
      } else {
        Alert.alert("Error", error.message || "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  // --- Sign Out Logic ---
  async function handleSignOut() {
    if (signOutLoading) return;
    setSignOutLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to sign out");
    } finally {
      setSignOutLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Setup Profile</Text>

        {/* --- Image Picker UI --- */}
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            {imageUri ? (
              <RNImage source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.plusIcon}>+</Text>
              </View>
            )}
            <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.imageHint}>Add a profile photo</Text>
        </View>

        {/* --- Inputs --- */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#C4C4C4"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#C4C4C4"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Bio (Optional)"
            placeholderTextColor="#C4C4C4"
            multiline={true}
            numberOfLines={3}
            value={bio}
            onChangeText={setBio}
          />

          <TextInput
            style={styles.input}
            placeholder="Website (Optional)"
            placeholderTextColor="#C4C4C4"
            autoCapitalize="none"
            value={website}
            onChangeText={setWebsite}
          />
        </View>

        {/* --- Submit Button --- */}
        <TouchableOpacity
          style={styles.button}
          onPress={makeAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Complete Profile</Text>
          )}
        </TouchableOpacity>

        {/* --- Sign Out --- */}
        <Text style={styles.secondaryText}>
          Not ready?{" "}
          <Text onPress={handleSignOut} style={styles.linkText}>
            {signOutLoading ? "Signing out..." : "Sign Out"}
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateProfile;

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F9", // Pastel Pink Background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontFamily: "SemiBold",
    color: "#8CD9B1", // Mint Green
    fontSize: 32,
    textAlign: "center",
    marginBottom: 30,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    // Soft shadow for the circle
    shadowColor: "#FFF5F9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: "white",
    marginBottom: 10,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#F7F7F7", // Light Grey (No Border)
    justifyContent: "center",
    alignItems: "center",
  },
  plusIcon: {
      fontSize: 40,
      color: "#D1D1D1",
      fontFamily: "SemiBold",
      marginTop: -5
  },
  editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: "#8CD9B1",
      width: 35,
      height: 35,
      borderRadius: 17.5,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#FFF5F9' // Matches background to look like a cutout
  },
  editBadgeText: {
      fontSize: 14
  },
  imageHint: {
    fontFamily: "Regular",
    color: "#888",
    fontSize: 14,
  },
  // Form Styles
  inputContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    height: 55,
    paddingHorizontal: 20,
    color: "#333",
    fontFamily: "Regular",
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 0, // <--- EXPLICITLY REMOVED BORDER
    // Soft Shadow to make white input pop against pink bg
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 100,
    paddingTop: 15,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#8CD9B1",
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
    elevation: 4,
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
    marginBottom: 30,
  },
  linkText: {
    fontFamily: "SemiBold",
    color: "#8CD9B1",
  },
});