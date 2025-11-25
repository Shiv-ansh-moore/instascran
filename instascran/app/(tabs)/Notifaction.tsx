import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabaseClient"; 
import { AuthContext } from "@/providers/AuthProvider"; 

// --- Types ---
interface NotificationItem {
  type: 'follow' | 'like' | 'comment';
  id: string;
  created_at: string;
  actor_id: string;
  actor_username: string;
  actor_avatar: string | null;
  post_id: string | null;
  post_image: string | null;
  content: string | null;
  is_following_back: boolean;
  // Resolved URL for display
  resolved_avatar_url: string | null;
}

// Helper for "1d", "2h", etc.
const timeAgoShort = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  return `${Math.floor(diffInHours / 24)}d`;
};

const Activity = () => {
  const { session } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Comments' | 'Follows' | 'Likes'>('All');

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_notifications', { current_user_id: session.user.id });

      if (error) throw error;

      // Resolve Avatars
      const processedData = (data || []).map((item: any) => {
        let avatarUrl = null;
        if (item.actor_avatar) {
            const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(item.actor_avatar);
            avatarUrl = pubData.publicUrl;
        }
        return { ...item, resolved_avatar_url: avatarUrl };
      });

      setNotifications(processedData);

    } catch (error: any) {
      console.error("Activity Error:", error);
      Alert.alert("Error", "Could not load activity");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleFollowBack = async (targetId: string) => {
    if (!session?.user) return;
    try {
        const { error } = await supabase.from('follows').insert({
            follower_id: session.user.id,
            following_id: targetId
        });
        if (error) throw error;
        
        // Optimistic update
        setNotifications(prev => prev.map(n => 
            n.actor_id === targetId ? { ...n, is_following_back: true } : n
        ));
    } catch (error) {
        Alert.alert("Error", "Could not follow user");
    }
  };

  // Filter Logic
  const filteredData = notifications.filter(item => {
      if (filter === 'All') return true;
      if (filter === 'Comments') return item.type === 'comment';
      if (filter === 'Follows') return item.type === 'follow';
      if (filter === 'Likes') return item.type === 'like';
      return true;
  });

  const renderItem = ({ item }: { item: NotificationItem }) => {
    return (
      <View style={styles.itemContainer}>
        {/* Unread Dot (Visual only for now) */}
        <View style={styles.dotContainer}>
            <View style={styles.unreadDot} />
        </View>

        {/* Avatar */}
        <Image 
            source={item.resolved_avatar_url ? { uri: item.resolved_avatar_url } : { uri: "https://placehold.co/100x100/png" }}
            style={styles.avatar}
        />

        {/* Content */}
        <View style={styles.textContainer}>
            <View style={styles.topLine}>
                <Text style={styles.username}>{item.actor_username}</Text>
                <Text style={styles.timeAgo}> {timeAgoShort(item.created_at)}</Text>
            </View>
            
            <Text style={styles.actionText}>
                {item.type === 'follow' && "Started following you"}
                {item.type === 'like' && "Liked your post"}
                {item.type === 'comment' && `Commented: "${item.content}"`}
            </Text>
            
            {/* Visual Flair for comments (Green Bar) */}
            {item.type === 'comment' && (
                <Text style={styles.subText}>Looks yummy!</Text>
            )}
        </View>

        {/* Right Side Action */}
        <View style={styles.rightAction}>
            {item.type === 'follow' ? (
                item.is_following_back ? (
                    <TouchableOpacity style={styles.followingBtn}>
                        <Text style={styles.followingText}>Following</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={styles.followBackBtn}
                        onPress={() => handleFollowBack(item.actor_id)}
                    >
                        <Text style={styles.followBackText}>Follow Back</Text>
                    </TouchableOpacity>
                )
            ) : (
                // Show Post Thumbnail for Likes/Comments
                item.post_image && (
                    <Image source={{ uri: item.post_image }} style={styles.postThumb} />
                )
            )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <Ionicons name="mail-outline" size={24} color="#8CD9B1" />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {['All', 'Comments', 'Follows', 'Likes'].map((tab) => (
            <TouchableOpacity 
                key={tab} 
                style={[styles.tab, filter === tab && styles.activeTab]}
                onPress={() => setFilter(tab as any)}
            >
                <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>
                    {tab === 'All' ? 'All Activity' : tab}
                </Text>
            </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#8CD9B1" />
        </View>
      ) : (
        <FlatList
            data={filteredData}
            keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8CD9B1" />}
            ListEmptyComponent={
                <Text style={styles.emptyText}>No recent activity.</Text>
            }
        />
      )}
    </SafeAreaView>
  );
};

export default Activity;

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8CD9B1', // Green Title
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#8CD9B1', // Green background for active
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activeTabText: {
    color: 'white',
  },

  // List Item
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dotContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D4D', // Red dot
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  timeAgo: {
    color: '#888',
    fontSize: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  subText: {
      color: '#999',
      fontSize: 12,
      marginTop: 2,
      borderLeftWidth: 2,
      borderLeftColor: '#ccc',
      paddingLeft: 6,
  },
  
  // Right Side Actions
  rightAction: {
      minWidth: 50,
      alignItems: 'flex-end',
  },
  postThumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
  },
  followBackBtn: {
      backgroundColor: '#8CD9B1',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
  },
  followBackText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 12,
  },
  followingBtn: {
      backgroundColor: '#eee',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
  },
  followingText: {
      color: '#888',
      fontWeight: '600',
      fontSize: 12,
  },
  
  emptyText: {
      textAlign: 'center',
      color: '#888',
      marginTop: 40,
  }
});