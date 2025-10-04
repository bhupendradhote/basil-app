import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import RenderHTML from 'react-native-render-html';
import Theme from '@/constants/theme';
import api from '@/services/_api';

const { width } = Dimensions.get('window');

type BlogItem = {
  id: number | string;
  type: 'blog' | 'video';
  title: string;
  image_file?: string;
  description?: string; // HTML content
  created_at?: string;
};

export default function BlogPostDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const blogId = params.id;
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        if (!blogId) {
          Alert.alert('Error', 'Invalid blog ID');
          router.back();
          return;
        }

        const response = await api.get(`/learning/${blogId}`);
        const data: BlogItem = response.data.data;

        if (!data || data.type !== 'blog') {
          Alert.alert('Error', 'Blog not found');
          router.back();
          return;
        }

        setBlog(data);
      } catch (err: any) {
        console.error('Failed to fetch blog:', err.response?.data || err.message);
        Alert.alert(
          'Error',
          err.response?.data?.message || 'Failed to fetch blog. Please try again.'
        );
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [blogId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.Colors.primary || '#123530'} />
      </View>
    );
  }

  if (!blog) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Blog Content */}
      <View style={styles.contentContainer}>
        {blog.image_file && (
          <Image
            source={{ uri: `https://basilstar.com/${blog.image_file}` }}
            style={styles.blogImage}
          />
        )}

        <Text style={styles.title}>{blog.title}</Text>
        <Text style={styles.date}>{blog.created_at?.split('T')[0] || ''}</Text>

        {/* Render HTML content */}
        {blog.description && (
          <RenderHTML
            contentWidth={width * 0.9}
            source={{ html: blog.description }}
            baseStyle={styles.htmlContent}
            enableExperimentalMarginCollapsing={true}
            tagsStyles={{
              p: { marginBottom: 10 },
              h1: { fontSize: 26, fontWeight: 'bold', marginVertical: 10 },
              h2: { fontSize: 22, fontWeight: 'bold', marginVertical: 8 },
              h3: { fontSize: 18, fontWeight: 'bold', marginVertical: 6 },
              li: { marginVertical: 4 },
              table: { borderWidth: 1, borderColor: '#ccc', marginVertical: 10 },
              th: { borderWidth: 1, borderColor: '#ccc', padding: 6, fontWeight: 'bold' },
              td: { borderWidth: 1, borderColor: '#ccc', padding: 6 },
            }}
          />
        )}
      </View>
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
    position: 'absolute',
    zIndex: 10,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 50,
    alignItems: 'center',
  },
  blogImage: {
    width: width * 0.9,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#123530',
    marginBottom: 8,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  htmlContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'justify',
  },
});
