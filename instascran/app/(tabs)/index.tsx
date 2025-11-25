import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabaseClient"; 
import { AuthContext } from "@/providers/AuthProvider"; 

// --- Interfaces ---

interface FeedPost {
  post_id: string;
  created_at: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  author_id: string;
  username: string;
  avatar_path: string | null;
  likes_count: number;
  comments_count: number;
  has_liked: boolean; // From new SQL
  resolved_avatar_url: string | null; 
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

// --- Helper: Time Ago ---
const timeAgo = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  return `${Math.floor(diffInHours / 24)}d`;
};

const HomeFeed = () => {
  const { session } = useContext(AuthContext);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Comment Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_home_feed', { current_user_id: session.user.id });

      if (error) throw error;

      const postsWithAvatars: FeedPost[] = (data || []).map((post: any) => {
        let publicAvatarUrl = null;
        if (post.avatar_path) {
            const { data: publicData } = supabase.storage
                .from('avatars')
                .getPublicUrl(post.avatar_path);
            publicAvatarUrl = publicData.publicUrl;
        }
        return { ...post, resolved_avatar_url: publicAvatarUrl };
      });

      setPosts(postsWithAvatars);

    } catch (error: any) {
      console.error("Feed error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  // --- LIKE LOGIC ---
  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!session?.user) return;

    // 1. Optimistic Update (Update UI immediately)
    setPosts(currentPosts => 
      currentPosts.map(p => {
        if (p.post_id === postId) {
          return {
            ...p,
            has_liked: !hasLiked,
            likes_count: hasLiked ? p.likes_count - 1 : p.likes_count + 1
          };
        }
        return p;
      })
    );

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: session.user.id });
      }
    } catch (error) {
      console.error("Like error", error);
      // Revert if error (Optional: implement revert logic here)
    }
  };

  // --- COMMENT LOGIC ---
  const openComments = (postId: string) => {
    setSelectedPostId(postId);
    setModalVisible(true);
  };

  const renderPost = ({ item }: { item: FeedPost }) => (
    <View style={styles.postCard}>
      <View style={styles.headerRow}>
        <View style={styles.userInfo}>
            <Image
                source={item.resolved_avatar_url ? { uri: item.resolved_avatar_url } : { uri: "https://placehold.co/100x100/png" }}
                style={styles.avatar}
            />
            <View style={styles.textGroup}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.timestamp}>{timeAgo(item.created_at)}</Text>
            </View>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="#333" />
      </View>

      {item.location && (
        <View style={styles.locationRow}>
             <Ionicons name="location-sharp" size={14} color="#000" />
             <Text style={styles.locationText}>{item.location}</Text>
        </View>
      )}

      <View style={styles.imageContainer}>
         <Image source={{ uri: item.image_url }} style={styles.postImage} />
      </View>

      <View style={styles.actionBar}>
         <View style={styles.leftActions}>
            {/* LIKE BUTTON */}
            <TouchableOpacity 
                style={styles.actionItem} 
                onPress={() => handleLike(item.post_id, item.has_liked)}
            >
                <Ionicons 
                    name={item.has_liked ? "heart" : "heart-outline"} 
                    size={26} 
                    color={item.has_liked ? "#FF3B30" : "#000"} 
                />
                <Text style={styles.actionText}>{item.likes_count}</Text>
            </TouchableOpacity>

            {/* COMMENT BUTTON */}
            <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => openComments(item.post_id)}
            >
                <Ionicons name="chatbubble-outline" size={24} color="#000" />
                <Text style={styles.actionText}>{item.comments_count}</Text>
            </TouchableOpacity>
         </View>
         
         <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="bookmark-outline" size={24} color="#000" />
         </TouchableOpacity>
      </View>

      {item.caption && (
        <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionUser}>{item.username} </Text>
            {item.caption}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#8CD9B1" />
        </View>
      ) : (
        <FlatList
            data={posts}
            keyExtractor={(item) => item.post_id}
            renderItem={renderPost}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8CD9B1" />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No posts found!</Text>
                </View>
            }
        />
      )}

      {/* COMMENTS MODAL */}
      <CommentsModal 
        visible={modalVisible} 
        onClose={() => {
            setModalVisible(false);
            setSelectedPostId(null);
            // Refresh feed to update comment counts when closing
            fetchFeed();
        }}
        postId={selectedPostId} 
      />
    </SafeAreaView>
  );
};

// ==========================================
// COMMENTS MODAL COMPONENT
// ==========================================
const CommentsModal = ({ visible, onClose, postId }: { visible: boolean, onClose: () => void, postId: string | null }) => {
    const { session } = useContext(AuthContext);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        if (visible && postId) {
            fetchComments();
        } else {
            setComments([]);
        }
    }, [visible, postId]);

    const fetchComments = async () => {
        if (!postId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('comments')
            .select('*, profiles(username, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setComments(data as any);
        }
        setLoading(false);
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !postId || !session?.user) return;
        setPosting(true);

        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: session.user.id,
                    content: newComment.trim()
                });

            if (error) throw error;
            
            setNewComment("");
            Keyboard.dismiss();
            fetchComments(); // Refresh list
        } catch (error) {
            Alert.alert("Error", "Could not post comment");
        } finally {
            setPosting(false);
        }
    };

    const resolveAvatar = (path: string | null) => {
        if (!path) return "https://placehold.co/100x100/png";
        return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
             <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Comments</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator style={{marginTop: 20}} color="#8CD9B1" />
                ) : (
                    <FlatList 
                        data={comments}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => (
                            <View style={styles.commentItem}>
                                <Image source={{ uri: resolveAvatar(item.profiles.avatar_url) }} style={styles.commentAvatar} />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUser}>
                                        {item.profiles.username} 
                                        <Text style={styles.commentTime}>  {timeAgo(item.created_at)}</Text>
                                    </Text>
                                    <Text style={styles.commentText}>{item.content}</Text>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={{padding: 16}}
                        ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet.</Text>}
                    />
                )}

                <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChangeText={setNewComment}
                    />
                    <TouchableOpacity onPress={handlePostComment} disabled={posting || !newComment.trim()}>
                        {posting ? <ActivityIndicator size="small" color="#8CD9B1" /> : (
                            <Text style={[styles.postButton, !newComment.trim() && {color: '#ccc'}]}>Post</Text>
                        )}
                    </TouchableOpacity>
                </View>
             </KeyboardAvoidingView>
        </Modal>
    );
};

export default HomeFeed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F9", 
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 50,
  },
  postCard: {
    marginBottom: 25,
    paddingHorizontal: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  textGroup: {
    marginLeft: 10,
  },
  username: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      marginLeft: 50, 
      marginTop: -5,
  },
  locationText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#000',
      marginLeft: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingHorizontal: 4,
  },
  leftActions: {
      flexDirection: 'row',
      gap: 15,
  },
  actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  actionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333'
  },
  caption: {
      marginTop: 8,
      marginHorizontal: 4,
      fontSize: 14,
      color: '#333',
      lineHeight: 20,
  },
  captionUser: {
      fontWeight: 'bold',
      color: '#000',
  },
  emptyState: {
      marginTop: 60,
      alignItems: 'center',
      paddingHorizontal: 30,
  },
  emptyText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#888',
      lineHeight: 24,
  },
  
  // --- Modal Styles ---
  modalContainer: {
      flex: 1,
      backgroundColor: '#fff',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
  },
  commentItem: {
      flexDirection: 'row',
      marginBottom: 20,
  },
  commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
  },
  commentContent: {
      flex: 1,
  },
  commentUser: {
      fontWeight: 'bold',
      marginBottom: 2,
  },
  commentTime: {
      fontWeight: 'normal',
      color: '#888',
      fontSize: 12,
  },
  commentText: {
      color: '#333',
      lineHeight: 20,
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingBottom: Platform.OS === 'ios' ? 40 : 16,
  },
  input: {
      flex: 1,
      backgroundColor: '#f1f1f1',
      padding: 10,
      borderRadius: 20,
      marginRight: 10,
  },
  postButton: {
      color: '#8CD9B1',
      fontWeight: 'bold',
      fontSize: 16,
  },
  noCommentsText: {
      textAlign: 'center',
      marginTop: 30,
      color: '#999',
  }
});