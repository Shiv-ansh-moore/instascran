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

  // --- Image Picker Logic (From Old App) ---
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

      const { error } = await supabase
        .from("profiles")
        .upsert(updates);

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.title}>Create Your Profile</Text>

        {/* --- Image Picker UI --- */}
        <View style={styles.imageContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.profileImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>+ Photo</Text>
                    </View>
                )}
            </TouchableOpacity>
            <Text style={styles.imageHint}>Tap to upload profile picture</Text>
        </View>

        {/* --- Inputs --- */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username (unique)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Bio (Optional)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline={true}
            numberOfLines={3}
            value={bio}
            onChangeText={setBio}
          />

          <TextInput
            style={styles.input}
            placeholder="Website (Optional)"
            placeholderTextColor="rgba(255,255,255,0.5)"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 60, 
  },
  title: {
    fontFamily: "SemiBold",
    color: "white",
    fontSize: 32,
    textAlign: "center",
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "rgba(77, 61, 61, 0.50)",
    backgroundColor: "#242424",
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#242424",
  },
  placeholderText: {
    color: "#3ECF8E",
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageHint: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 8,
  },
  // Form Styles
  inputContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#242424",
    borderColor: "rgba(77, 61, 61, 0.50)",
    borderWidth: 1,
    borderRadius: 20,
    height: 50,
    paddingHorizontal: 20,
    color: "white",
    fontFamily: "Regular",
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    paddingTop: 15,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: "#3ECF8E",
    width: "100%",
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontFamily: "Regular",
    color: "white",
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryText: {
    fontFamily: "Regular",
    color: "#AAAAAA",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  linkText: {
    fontFamily: "Regular",
    color: "#3ECF8E",
    fontSize: 16,
  },
});