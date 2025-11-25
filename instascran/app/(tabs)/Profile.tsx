import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabaseClient"; 
import { AuthContext } from "@/providers/AuthProvider"; 
import { SafeAreaView } from "react-native-safe-area-context";

// --- Types ---
interface ProfileData {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
}

interface PostData {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string; // Needed for date display
}

interface StatBoxProps {
  label: string;
  value: number;
}

// --- Helper: Format Date to DD/MM ---
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-indexed
  return `${day}/${month}`;
};

// --- Component: Stat Box ---
const StatBox = ({ label, value }: StatBoxProps) => (
  <View style={styles.statBoxContainer}>
    <View style={styles.statBox}>
      <Text style={styles.statNumber}>{value}</Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ProfileScreen = () => {
  const { session } = useContext(AuthContext);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Stats State
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  // --- Fetch Data ---
  const fetchProfileData = useCallback(async () => {
    if (!session?.user) return;

    try {
      const userId = session.user.id;

      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      if (profileData) {
        setProfile(profileData);
        if (profileData.avatar_url) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(profileData.avatar_url);
          setAvatarUrl(data.publicUrl);
        }
      }

      // 2. Fetch Posts
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (postError) throw postError;
      setPosts(postData || []);

      // 3. Fetch Follow Counts
      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      setFollowingCount(following || 0);
      setFollowersCount(followers || 0);

    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  // --- Render Single Post ---
  const renderPost = ({ item }: { item: PostData }) => (
    <View style={styles.postWrapper}>
      <TouchableOpacity style={styles.postImageContainer}>
         <Image source={{ uri: item.image_url }} style={styles.postImage} />
      </TouchableOpacity>
      {/* Date displayed below post */}
      <Text style={styles.postDate}>{formatDate(item.created_at)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#8CD9B1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        numColumns={2} 
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8CD9B1" />
        }
        ListHeaderComponent={
          <>
            {/* --- NEW HEADER LAYOUT --- */}
            <View style={styles.headerContainer}>
              
              {/* LEFT COLUMN: Avatar + Name + Edit Trigger */}
              <View style={styles.leftColumn}>
                <TouchableOpacity 
                  onPress={() => setEditModalVisible(true)}
                  activeOpacity={0.8}
                  style={styles.avatarWrapper}
                >
                  <Image
                    source={avatarUrl ? { uri: avatarUrl } : { uri: "https://placehold.co/100x100/png" }}
                    style={styles.avatar}
                  />
                  {/* Edit Icon Overlay */}
                  <View style={styles.editIconBadge}>
                    <Ionicons name="pencil" size={14} color="white" />
                  </View>
                </TouchableOpacity>
                
                <Text style={styles.username}>
                  {profile?.username || "New User"}
                </Text>
              </View>

              {/* RIGHT COLUMN: Stats + Bio */}
              <View style={styles.rightColumn}>
                {/* Row 1: Stats */}
                <View style={styles.statsRow}>
                  <StatBox label="Followers" value={followersCount} />
                  <StatBox label="Following" value={followingCount} />
                </View>

                {/* Row 2: Bio (Under stats) */}
                <View style={styles.bioContainer}>
                  <Text style={styles.bioText}>
                     {profile?.bio || "No bio yet."}
                  </Text>
                </View>
              </View>

            </View>
            {/* --- END HEADER --- */}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet. Start snapping!</Text>
          </View>
        }
      />

      {/* --- Edit Profile Modal --- */}
      <EditProfileModal 
        visible={isEditModalVisible} 
        onClose={() => setEditModalVisible(false)}
        currentProfile={profile}
        onUpdate={onRefresh}
      />
    </SafeAreaView>
  );
};

// ==========================================================
// INTERNAL EDIT MODAL
// ==========================================================
const EditProfileModal = ({ visible, onClose, currentProfile, onUpdate }: any) => {
  const { session } = useContext(AuthContext);
  const [username, setUsername] = useState(currentProfile?.username || "");
  const [fullName, setFullName] = useState(currentProfile?.full_name || "");
  const [bio, setBio] = useState(currentProfile?.bio || "");
  const [website, setWebsite] = useState(currentProfile?.website || "");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false); // [NEW] State for sign out

  useEffect(() => {
    if (currentProfile) {
        setUsername(currentProfile.username);
        setFullName(currentProfile.full_name || "");
        setBio(currentProfile.bio || "");
        setWebsite(currentProfile.website || "");
    }
  }, [currentProfile]);

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
      Alert.alert("Error", "Could not pick image");
    }
  };

  const handleUpdate = async () => {
    if (!session?.user) return;
    setLoading(true);

    try {
      let avatarPath = currentProfile?.avatar_url;
      if (imageData) {
        const fileExt = imageData.mimeType.split("/").pop();
        const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, decode(imageData.base64), { contentType: imageData.mimeType, upsert: true });

        if (uploadError) throw uploadError;
        avatarPath = filePath;
      }

      const updates = {
        id: session.user.id,
        username,
        full_name: fullName,
        bio,
        website,
        avatar_url: avatarPath,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;

      onUpdate();
      onClose();

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // [NEW] Sign Out Function
  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        onClose(); // Close modal
    } catch (error: any) {
        Alert.alert("Error signing out", error.message);
    } finally {
        setSignOutLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
        <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={30} color="#333" />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
            <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.modalAvatar} />
                ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                         <Ionicons name="camera" size={40} color="#888" />
                    </View>
                )}
                <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
            <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} />
            <TextInput style={styles.input} placeholder="Website" value={website} onChangeText={setWebsite} />

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>

            {/* [NEW] Sign Out Button */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} disabled={signOutLoading}>
                {signOutLoading ? (
                     <ActivityIndicator color="#FF6B6B" /> 
                ) : (
                    <Text style={styles.signOutText}>Sign Out</Text>
                )}
            </TouchableOpacity>
            
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ProfileScreen;

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F9", 
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  
  // --- HEADER STYLES ---
  headerContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    alignItems: 'flex-start', 
  },
  leftColumn: {
    width: '35%', 
    alignItems: 'center',
    marginRight: 15,
  },
  rightColumn: {
    flex: 1, 
  },
  
  // Avatar & Edit
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'white',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#8CD9B1',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  username: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  // Stats & Bio
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  statBoxContainer: {
    alignItems: 'center',
    flex: 1, 
  },
  statBox: {
    backgroundColor: '#8CD9B1', 
    width: 70, 
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: "#8CD9B1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    // elevation: 3,
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },

  // Bio Bubble
  bioContainer: {
    backgroundColor: 'white',
    marginLeft:"10%",
    padding: 12,
    borderRadius: 12,
    width: '80%',
    minHeight: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bioText: {
    color: '#555',
    fontSize: 13,
    lineHeight: 18,
  },

  // --- Grid/Post Styles ---
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20, 
  },
  postWrapper: {
    width: '48%',
    marginBottom: 10,
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 1, 
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  postDate: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },

  // --- Modal Styles ---
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF5F9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 50,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  modalAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#8CD9B1',
    marginTop: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#8CD9B1',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // [NEW] Sign Out Button Styles
  signOutButton: {
    marginTop: 25,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    backgroundColor: 'transparent',
  },
  signOutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});