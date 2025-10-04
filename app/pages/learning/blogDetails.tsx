import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Theme from '@/constants/theme';
import api from '@/services/_api';

const { width } = Dimensions.get('window');

type BlogItem = {
  id: number | string;
  type: 'blog' | 'video';
  title: string;
  image_file?: string;
  created_at?: string;
  description?: string;
};

export default function BlogDetails() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get('/learning');
        const data: BlogItem[] = response.data.data || [];
        // Filter only blogs and sort by latest
        const filteredBlogs = data
          .filter(item => item.type === 'blog')
          .sort((a, b) => (b.created_at?.localeCompare(a.created_at || '') || 0));
        setBlogs(filteredBlogs);
      } catch (err: any) {
        console.error('Failed to fetch blogs:', err.response?.data || err.message);
        Alert.alert(
          'Error',
          err.response?.data?.message || 'Failed to fetch blogs. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      {blogs.map(blog => (
        <TouchableOpacity
          key={blog.id}
          style={styles.blogCard}
          onPress={() =>
            router.push({
              pathname: '/pages/learning/blogPostDetails',
              params: { id: String(blog.id) },
            })
          }
        >
          <Image
            source={{ uri: `https://basilstar.com/${blog.image_file}` }}
            style={styles.blogImage}
          />
          <Text style={styles.blogTitle}>{blog.title}</Text>
          <Text style={styles.itemDate}>{blog.created_at?.split('T')[0] || ''}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.light.background || '#fffbf5',
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: 16,
    marginBottom: 16,
    backgroundColor: '#123530',
    padding: 6,
    borderRadius: 8,
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogCard: {
    width,
    alignItems: 'center',
    marginBottom: 20,
  },
  blogImage: {
    width: width * 0.9,
    height: 250,
    borderRadius: 12,
  },
  blogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#123530',
    marginTop: 12,
    textAlign: 'center',
  },
  itemDate: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
});