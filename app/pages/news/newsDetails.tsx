import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/theme';
import { getLatestNews } from '@/services/_fmpApi';

const { width } = Dimensions.get('window');

type NewsItem = {
  symbol: string | null;
  publishedDate: string;
  publisher: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
};

export default function NewsDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [blog, setBlog] = useState<NewsItem | null>(null);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Safe title param
  let newsTitleParam = '';
  if (params.title) {
    try {
      newsTitleParam = decodeURIComponent(params.title as string);
    } catch {
      newsTitleParam = params.title as string; // fallback if decode fails
    }
  }

  const fetchNewsDetails = async () => {
    try {
      setLoading(true);
      const data: NewsItem[] = await getLatestNews(0, 50);

      if (!data || data.length === 0) {
        Alert.alert('No news found');
        return;
      }

      // Find selected blog by title or fallback to first
      const selectedBlog = data.find((item) => item.title === newsTitleParam) || data[0];
      setBlog(selectedBlog);

      setRecentNews(data.filter((item) => item.title !== selectedBlog.title).slice(0, 5));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load news details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsDetails();
  }, [newsTitleParam]);

  // Helper to truncate words
  const truncateWords = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const renderRecentNews = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.recentCard}
      onPress={() =>
        router.push({
          pathname: '/pages/news/newsDetails',
          params: { title: item.title }, // pass plain text to avoid decode errors
        })
      }
    >
      <View style={styles.recentTextContainer}>
        <Text style={styles.recentTitle}>{truncateWords(item.title, 10)}</Text>
        <Text style={styles.recentDate}>
          {new Date(item.publishedDate).toLocaleDateString()}
        </Text>
      </View>
      <Image source={{ uri: item.image }} style={styles.recentImage} />
    </TouchableOpacity>
  );

  if (loading || !blog) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#123530" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#123530" />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Image source={{ uri: blog.image }} style={styles.blogImage} />
          <Text style={styles.title}>{blog.title}</Text>
          <Text style={styles.date}>
            {new Date(blog.publishedDate).toLocaleDateString()} • {blog.site || blog.publisher}
          </Text>
          <Text style={styles.content}>{blog.text}</Text>

          <TouchableOpacity
            onPress={() => Linking.openURL(blog.url)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>Read Full Article</Text>
          </TouchableOpacity>

          <Text style={styles.recentHeader}>Recent News</Text>
          <FlatList
            data={recentNews}
            keyExtractor={(item) => item.title}
            renderItem={renderRecentNews}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.Colors.light.background || '#fffbf5' },
  backButton: {
    marginLeft: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 8,
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 10,
  },
  contentContainer: { paddingBottom: 50 },
  blogImage: { width: width, height: 250, marginBottom: 16 },
  title: { fontSize: 22, paddingHorizontal: 16, lineHeight: 28, fontWeight: '500', color: '#123530', marginBottom: 8, textAlign: 'center' },
  date: { fontSize: 12, color: '#555', marginBottom: 16, textAlign: 'left', paddingHorizontal: 16 },
  content: { fontSize: 13, color: '#333', lineHeight: 21, textAlign: 'justify', paddingHorizontal: 16 },
  readMoreButton: {
    marginTop: 18,
    padding: 12,
    backgroundColor: '#123530',
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
    alignSelf: 'center', // centers the button horizontally
  },
  readMoreText: { color: '#fff', fontWeight: '600' },
  recentHeader: { fontSize: 22, fontWeight: '500', color: '#123530', marginTop: 40, marginBottom: 20, textAlign: 'center', paddingHorizontal: 16 },
  recentCard: { flexDirection: 'row', marginHorizontal: 12, marginBottom: 16, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1235300D' },
  recentImage: { width: 120, maxHeight: 100, borderRadius: 8 },
  recentTextContainer: { flex: 1, padding: 8, justifyContent: 'center' },
  recentTitle: { fontSize: 14, fontWeight: '500', color: '#123530', marginBottom: 10, lineHeight: 22 },
  recentDate: { fontSize: 12, color: '#555' },
});
