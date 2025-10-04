import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import Theme from '@/constants/theme';
import api from '@/services/_api';

const { width } = Dimensions.get('window');

type VideoItem = {
  id: number | string;
  type: 'blog' | 'video';
  title: string;
  video_file?: string; // direct MP4
  video_url?: string;  // YouTube URL
  created_at?: string;
};

export default function VideoDetails() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get('/learning');
        const data: VideoItem[] = response.data.data || [];
        const filteredVideos = data
          .filter(item => item.type === 'video')
          .sort((a, b) => (b.created_at?.localeCompare(a.created_at || '') || 0))
          .slice(0, 5); // latest 5 videos
        setVideos(filteredVideos);
      } catch (err: any) {
        console.error('Failed to fetch videos:', err.response?.data || err.message);
        Alert.alert(
          'Error',
          err.response?.data?.message || 'Failed to fetch videos. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const renderVideoCard = useCallback((video: VideoItem) => {
    // Detect YouTube video ID
    const youtubeMatch = video.video_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^\s&]+)/);
    const youtubeId = youtubeMatch ? youtubeMatch[1] : null;

    return (
      <View key={video.id} style={styles.videoCard}>
        {youtubeId ? (
          <YoutubePlayer
            height={250}
            width={width * 0.9}
            videoId={youtubeId}
          />
        ) : video.video_file ? (
          <Video
            source={{ uri: video.video_file }}
            style={styles.video}
            useNativeControls
            resizeMode={'cover' as ResizeMode}
          />
        ) : (
          <Text style={{ color: 'red', marginVertical: 20 }}>No video available</Text>
        )}

        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.date}>{video.created_at?.split('T')[0] || ''}</Text>
      </View>
    );
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      {videos.map(renderVideoCard)}
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
  videoCard: {
    width,
    alignItems: 'center',
    marginBottom: 20,
  },
  video: {
    width: width * 0.9,
    height: 250,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#123530',
    marginTop: 12,
  },
  date: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
});
