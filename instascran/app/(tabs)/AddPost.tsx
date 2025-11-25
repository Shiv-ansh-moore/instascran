import React, { useState, useRef, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CameraView,
  CameraType,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
// FIX 3: Use the legacy import to silence the warning and ensure stability
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/providers/AuthProvider";

const AddPost = () => {
  const { session } = useContext(AuthContext);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Camera State
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");

  // Post State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // --- Camera Functions ---
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
        });
        if (photo?.uri) {
          setImageUri(photo.uri);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRetake = () => {
    setImageUri(null);
    setCaption("");
  };

  // --- Upload & Post Logic ---
  const handlePost = async () => {
    if (!imageUri || !session?.user) return;

    setIsUploading(true);

    try {
      // Read file as Base64 using legacy API
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });
      const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      const contentType = `image/${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(filePath, decode(base64), {
          contentType,
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("posts").getPublicUrl(filePath);

      // Insert into Database
      const { error: dbError } = await supabase.from("posts").insert({
        user_id: session.user.id,
        image_url: publicUrl,
        caption: caption.trim(),
        location: "Unknown",
      });

      if (dbError) throw dbError;

      Alert.alert("Success", "Post shared successfully!");
      handleRetake();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to post.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Render Permissions ---
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need camera access to take food snaps!
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPrimary}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Render Preview & Caption Screen ---
  if (imageUri) {
    return (
      <SafeAreaView style={styles.previewContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.previewContent}>
              {/* Header */}
              <View style={styles.previewHeader}>
                <TouchableOpacity onPress={handleRetake} disabled={isUploading}>
                  <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Post</Text>
                <View style={{ width: 28 }} />
              </View>

              {/* Image Preview */}
              <Image source={{ uri: imageUri }} style={styles.finalImage} />

              {/* Input Section */}
              <View style={styles.inputSection}>
                <View style={styles.captionContainer}>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Write a caption..."
                    placeholderTextColor="#999"
                    multiline
                    value={caption}
                    onChangeText={setCaption}
                    maxLength={2200}
                  />
                </View>
              </View>

              {/* Post Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.btnPrimary, isUploading && styles.btnDisabled]}
                  onPress={handlePost}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.btnText}>Share Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    );
  }

  // --- Render Camera View ---
  // FIX 2: Structure changed. CameraView is a sibling to the overlay, not a parent.
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      />

      {/* Controls Overlay (Sits ON TOP of camera) */}
      <SafeAreaView style={styles.cameraOverlay}>
        {/* Top Bar */}
        <View style={styles.topControls}>
          <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={28}
              color={flash === "on" ? "#FFD700" : "white"}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomControls}>
          <View style={styles.spacer} />

          {/* Shutter Button */}
          <TouchableOpacity onPress={takePicture} style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity
            onPress={toggleCameraFacing}
            style={styles.iconButton}
          >
            <Ionicons name="camera-reverse" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default AddPost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF5F9",
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },

  // Camera Styles
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject, // FIX 2: This makes the overlay cover the entire screen
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: 20,
    paddingTop: -35, 
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 20, // Adjusted for SafeAreaView
  },
  spacer: {
    width: 30,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "white",
  },

  // Preview / Post Screen Styles
  previewContainer: {
    flex: 1,
    backgroundColor: "#FFF5F9",
  },
  previewContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  finalImage: {
    width: "100%",
    height: 400,
    borderRadius: 20,
    marginTop: 10,
    backgroundColor: "#eee",
  },
  inputSection: {
    marginTop: 20,
  },
  captionContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  captionInput: {
    fontSize: 16,
    color: "#333",
    minHeight: 60,
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "#8CD9B1",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    shadowColor: "#8CD9B1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: "#A8DABC",
    opacity: 0.7,
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
