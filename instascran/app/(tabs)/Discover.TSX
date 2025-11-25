import React, { useEffect, useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ListRenderItem,
  TextInput,
  Keyboard,
} from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { AuthContext } from "../../providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  updated_at: string | null;
  avatarSource?: string | null;
}

const Discover = () => {
  const { session } = useContext(AuthContext);

  const [users, setUsers] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // 1. Add Search State
  const [searchQuery, setSearchQuery] = useState("");

  // 2. Debounce Effect: Only fetch when typing stops for 500ms
  useEffect(() => {
    if (!session?.user) return;

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, session]);

  const fetchUsers = async () => {
    if (!session?.user) return;
    setLoading(true);

    try {
      const currentUserId = session.user.id;

      // A. Get list of people I follow (We need this for button state regardless of search)
      const { data: existingFollows, error: followError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId);

      if (followError) throw followError;

      // Update the Set so the buttons know who is followed
      const currentFollowingSet = new Set(
        existingFollows?.map((i: any) => i.following_id)
      );
      setFollowingIds(currentFollowingSet);

      // B. Build the Query
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId) // Never show myself
        .limit(20);

      // C. Conditional Logic
      if (searchQuery.trim().length > 0) {
        // --- SEARCH MODE ---
        // Search by username OR full_name (case insensitive)
        query = query.or(
          `username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`
        );
      } else {
        // --- DISCOVERY MODE (Default) ---
        // Exclude people I already follow
        const excludedIds = Array.from(currentFollowingSet);
        excludedIds.push(currentUserId);

        if (excludedIds.length > 0) {
          query = query.not("id", "in", `(${excludedIds.join(",")})`);
        }
      }

      const { data: profiles, error: profileError } = await query;

      if (profileError) throw profileError;

      if (profiles) {
        // Resolve Avatar URLs
        const profilesWithAvatars: Profile[] = profiles.map((profile: any) => {
          let avatarSource = null;
          if (profile.avatar_url) {
            const { data } = supabase.storage
              .from("avatars")
              .getPublicUrl(profile.avatar_url);
            avatarSource = data.publicUrl;
          }
          return { ...profile, avatarSource };
        });

        setUsers(profilesWithAvatars);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!session?.user) return;

    // Optimistic Update
    setFollowingIds((prev) => {
      const next = new Set(prev);
      next.add(targetUserId);
      return next;
    });

    try {
      const { error } = await supabase.from("follows").insert({
        follower_id: session.user.id,
        following_id: targetUserId,
      });

      if (error) throw error;
    } catch (error) {
      Alert.alert("Error", "Could not follow user.");
      // Revert
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const renderItem: ListRenderItem<Profile> = ({ item }) => {
    const isFollowing = followingIds.has(item.id);

    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <Image
            source={
              item.avatarSource
                ? { uri: item.avatarSource }
                : { uri: "https://placehold.co/100x100/png?text=User" }
            }
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            <Text style={styles.username}>{item.username}</Text>
            {item.full_name && (
              <Text style={styles.fullName}>{item.full_name}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={() => handleFollow(item.id)}
          disabled={isFollowing}
        >
          <Text
            style={[
              styles.followBtnText,
              isFollowing && styles.followingBtnText,
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Discover</Text>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Find accounts..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              Keyboard.dismiss();
            }}
          >
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8CD9B1" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery ? "No users found." : "No suggestions available."}
            </Text>
          }
        />
      )}
    </View>
  );
};

export default Discover;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F9",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontFamily: "SemiBold",
    fontSize: 28,
    color: "#333",
    marginBottom: 15,
  },
  // --- Search Styles ---
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Regular",
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F7F7F7",
  },
  textContainer: {
    marginLeft: 12,
  },
  username: {
    fontFamily: "SemiBold",
    fontSize: 16,
    color: "#333",
  },
  fullName: {
    fontFamily: "Regular",
    fontSize: 13,
    color: "#888",
  },
  followBtn: {
    backgroundColor: "#8CD9B1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 90,
    alignItems: "center",
    shadowColor: "#8CD9B1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  followingBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#8CD9B1",
    elevation: 0,
    shadowOpacity: 0,
  },
  followBtnText: {
    fontFamily: "SemiBold",
    color: "#fff",
    fontSize: 14,
  },
  followingBtnText: {
    color: "#8CD9B1",
  },
  emptyText: {
    textAlign: "center",
    fontFamily: "Regular",
    color: "#888",
    marginTop: 50,
  },
});
