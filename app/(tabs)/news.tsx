import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Theme from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/_api';
import { getLatestNews } from '@/services/_fmpApi';
import { useRouter } from 'expo-router';
import Chatbot from '../component/Chatbot';

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

export default function NewsScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Theme.Colors.dark : Theme.Colors.light;
  const router = useRouter();

  const [userName, setUserName] = useState<string>('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Load logged-in user
  const loadUser = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserName(parsedUser.name || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const truncateWords = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Fetch news from FMP API
  const fetchNews = async (nextPage: number = 0) => {
    if (!hasMore) return;

    try {
      if (nextPage === 0) setLoading(true);
      else setIsLoadingMore(true);

      const data = await getLatestNews(nextPage, 20);

      if (data.length === 0) {
        setHasMore(false);
      } else {
        setNews((prev) => (nextPage === 0 ? data : [...prev, ...data]));
        setPage(nextPage);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load news.');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadUser();
    fetchNews(0);
  }, []);

  // Logout function
  const handleLogout = async () => {
    try {
      await api.post('/logout');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      Alert.alert('Logged Out', 'You have been successfully logged out.');
      router.replace('/(auth)/AuthScreen');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Logout failed');
    }
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/pages/news/newsDetails',
          params: { title: encodeURIComponent(item.title) },
        })
      }
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text, fontFamily: Theme.Fonts.heading }]}>
            {truncateWords(item.title, 10)}
          </Text>
          <Text style={[styles.date, { color: colors.icon, fontFamily: Theme.Fonts.body }]}>
            {item.publishedDate} • {item.site || item.publisher}
          </Text>
        </View>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: '#ccc' }]} />
        )}
      </View>
    </TouchableOpacity>
  );

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="view-dashboard" size={28} color="#123530" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {userName ? <Text style={{ fontSize: 16, fontWeight: '600' }}>{userName}</Text> : null}
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#123530" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="notifications" size={28} color="#123530" />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Chat Button */}
      <View style={{ position: 'absolute', bottom: 60, right: 10 }} >
        <Chatbot />
      </View>

      {/* News Section */}
      <View style={styles.trendingContainer}>
        <Text style={[styles.trendingHeader, { color: colors.text }]}>Trending News</Text>
      </View>

      {loading && page === 0 ? (
        <ActivityIndicator size="large" color="#123530" />
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item, index) => item.title} // using title as key
          renderItem={renderNewsItem}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchNews(page + 1)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#123530" /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,
    paddingHorizontal: 16,

  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingContainer: { marginBottom: 16 },
  trendingHeader: { ...Theme.Typography.heading },
  card: {
    backgroundColor: '#1235300D',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  textContainer: { flex: 1, paddingRight: 12 },
  image: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#ccc' },
  title: {
    fontSize: Theme.Typography.subHeading.fontSize,
    fontWeight: Theme.Typography.subHeading.fontWeight,
    lineHeight: Theme.Typography.subHeading.lineHeight,
    marginBottom: 10,
  },
  date: { fontSize: Theme.Typography.small.fontSize },
  aiButton: { zIndex: 10 },
  aiInner: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  aiButtonTitle: {
    fontSize: 10,
    fontFamily: 'Bree',
    fontWeight: '600',
    color: '#123530',
    textTransform: 'lowercase',
  },
  aiIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
