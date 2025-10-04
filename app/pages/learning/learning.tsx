import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import Theme from '@/constants/theme';
import api from '@/services/_api';

const { width } = Dimensions.get('window');

type LearningItem = {
  id: number;
  title: string;
  type: 'blog' | 'video';
  description?: string;
  image_file?: string;
  video_file?: string;
  video_url?: string;
  created_at?: string;
};

export default function Learning() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<LearningItem[]>([]);
  const [videos, setVideos] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLearnings = async () => {
      try {
        const response = await api.get('/learning');
        const data: LearningItem[] = response.data.data || [];

        // Limit to 5 each
        setBlogs(data.filter(item => item.type === 'blog').slice(0, 5));
        setVideos(data.filter(item => item.type === 'video').slice(0, 5));
      } catch (err: any) {
        console.error('Failed to fetch learnings:', err.response?.data || err.message);
        Alert.alert(
          'Error',
          err.response?.data?.message || 'Failed to fetch learnings. Please login again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLearnings();
  }, []);

  // Render Video Card
  const renderVideoCard = useCallback((item: LearningItem) => {
    if (!item.video_file && !item.video_url) return null;

    const youtubeMatch = item.video_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^\s&]+)/);
    const youtubeId = youtubeMatch ? youtubeMatch[1] : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.videoCard}
        onPress={() =>
          router.push({
            pathname: '/pages/learning/videoDetails',
            params: { id: String(item.id) },
          })
        }
      >
        {youtubeId ? (
          <YoutubePlayer height={180} width={width * 0.9} videoId={youtubeId} />
        ) : item.video_file ? (
          <Video
            source={{ uri: item.video_file }}
            style={styles.video}
            useNativeControls
            resizeMode={'cover' as ResizeMode}
          />
        ) : null}

        <Text style={styles.videoTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{item.created_at?.split('T')[0] || ''}</Text>
      </TouchableOpacity>
    );
  }, [router]);

  // Render Blog Card
  const renderBlogCard = useCallback((item: LearningItem) => {
    if (!item.image_file) return null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.blogCard}
        onPress={() =>
          router.push({
            pathname: '/pages/learning/blogPostDetails',
            params: { id: String(item.id) }, // pass blog ID dynamically
          })
        }
      >
        <Image
          source={{ uri: `https://basilstar.com/${item.image_file}` }}
          style={styles.blogImage}
        />
        <Text style={styles.blogTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{item.created_at?.split('T')[0] || ''}</Text>
      </TouchableOpacity>
    );
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Learning</Text>

      {/* Videos Section */}
      {videos.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Videos</Text>
            <TouchableOpacity onPress={() => router.push('/pages/learning/videoDetails')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {videos.map(renderVideoCard)}
          </ScrollView>
        </>
      )}

      {/* Blogs Section */}
      {blogs.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Blogs</Text>
            <TouchableOpacity onPress={() => router.push('/pages/learning/blogDetails')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {blogs.map(renderBlogCard)}
          </ScrollView>
        </>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Theme.Colors.light.background || '#fffbf5', paddingTop: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 16, backgroundColor: '#123530', padding: 6, borderRadius: 8, width: 35, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#123530', marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#123530', marginBottom: 12 },
  viewAll: { fontSize: 14, fontWeight: '600', color: '#1E90FF' },
  videoCard: { marginRight: 16, width: width * 0.9, borderRadius: 12, overflow: 'hidden', marginBottom: 20, position: 'relative' },
  video: { width: '100%', height: 180, borderRadius: 12 },
  videoTitle: { fontSize: 14, fontWeight: '600', padding: 8, color: '#333' },
  blogCard: { marginRight: 16, width: width * 0.9, borderRadius: 12, overflow: 'hidden' },
  blogImage: { width: '100%', height: 190, resizeMode: 'cover', borderRadius: 12 },
  blogTitle: { fontSize: 14, fontWeight: '600', padding: 8, color: '#333' },
  itemDate: { fontSize: 12, color: '#555', paddingHorizontal: 8, marginBottom: 8 },
});
