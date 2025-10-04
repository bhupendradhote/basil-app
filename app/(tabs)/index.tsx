import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/_api';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import IndexChart from '@/components/dashboard/IndexChart';
import Chatbot from '../component/Chatbot';

export default function DashboardScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');

  // Load logged-in user from AsyncStorage
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

  useEffect(() => {
    loadUser();
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
      console.error('Logout error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Logout failed');
    }
  };

  // Explore More Data
  const exploreItems = [
    {
      title: 'Daily Analysis',
      icon: 'analytics-outline',
      cardStyle: styles.cardDaily,
      textStyle: styles.titleDaily,
      iconSize: 45,
      onPress: () => router.push('/pages/fundamental/fundamental'),

    },
    {
      title: "Today's Outlooks",
      icon: 'calendar-outline',
      cardStyle: styles.cardOutlooks,
      textStyle: styles.titleOutlooks,
      iconSize: 45,
      onPress: () => router.push('/pages/todaysOutlook/todaysOutlook'),
    },
    {
      title: 'Learning',
      icon: 'school-outline',
      cardStyle: styles.cardLearning,
      textStyle: styles.titleLearning,
      iconSize: 24,
      onPress: () => router.push('/pages/learning/learning'),
    },
    {
      title: 'Upcoming Events',
      icon: 'calendar-number-outline',
      cardStyle: styles.cardEvents,
      textStyle: styles.titleEvents,
      iconSize: 24,
      onPress: () => router.push('/pages/upcomingEvents/upcomingEvents'),

    },
    {
      title: 'Calculator',
      icon: 'calculator-outline',
      cardStyle: styles.cardCalculator,
      textStyle: styles.titleCalculator,
      iconSize: 24,
      onPress: () => router.push('/pages/calculator/calculator'),
    },
  ];

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 + (insets.bottom || 0) + 24 }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <MaterialCommunityIcons name="view-dashboard" size={28} color="#123530" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {userName ? <Text style={styles.userName}>{userName}</Text> : null}
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="#123530" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="notifications" size={28} color="#123530" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeBox}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.welcomeName}>{userName || "User"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/pages/profile/userProfile")}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=12" }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        {/* Explore More Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore More</Text>
        </View>
        <View style={styles.cardGrid}>
          {exploreItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.exploreCard, item.cardStyle]}
              onPress={item.onPress}
            >
              <Text style={[styles.exploreCardText, item.textStyle]}>{item.title}</Text>
              <View style={styles.iconWrapper}>
                <Ionicons name={item.icon as any} size={item.iconSize} color="#123530" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Indices Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Indices</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>


        <IndexChart />

        {/* Market Movers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market Movers</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Chatbot (floating global assistant) */}
      <View style={{ position: 'absolute', bottom: 60, right: 10 }} >
        <Chatbot />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, paddingHorizontal: 16,
    backgroundColor: '#fffbf5',
  },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', },
  userName: { fontSize: 16, fontWeight: '600' },
  welcomeBox: { backgroundColor: '#fffbf5', borderRadius: 12, paddingVertical: 12, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontSize: 20, fontWeight: '600', color: '#123530' },
  welcomeName: { fontSize: 18, fontWeight: '400', color: '#5EC385' },
  profileImage: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ddd' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: '500', color: '#123530' },
  viewAll: { fontSize: 14, color: '#5EC385' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  exploreCard: { width: '47%', borderRadius: 12, padding: 16, marginBottom: 2, justifyContent: 'space-between', position: 'relative', borderColor: '#12353026', borderWidth: 1, minHeight: 90 },
  exploreCardText: { fontSize: 15, fontWeight: '500', color: '#123530' },
  iconWrapper: { position: 'absolute', bottom: 10, right: 10 },
  cardDaily: { backgroundColor: '#12353015' },
  cardOutlooks: { backgroundColor: '#12353015' },
  cardLearning: { backgroundColor: '#12353015', width: '30%' },
  cardEvents: { backgroundColor: '#12353015', width: '30%' },
  cardCalculator: { backgroundColor: '#12353015', width: '30%' },
  titleDaily: { color: '#123530', fontSize: 18, marginBottom: 75, fontWeight: '600' },
  titleOutlooks: { color: '#123530', fontSize: 18, marginBottom: 75, fontWeight: '600' },
  titleLearning: { color: '#123530', fontSize: 14, marginBottom: 40, fontWeight: '600' },
  titleEvents: { color: '#123530', fontSize: 14, marginBottom: 40, fontWeight: '600' },
  titleCalculator: { color: '#123530', fontSize: 14, marginBottom: 40, fontWeight: '600' },
  aiButton: { position: 'absolute', bottom: 20, right: 20, zIndex: 10 },
  aiInner: { flexDirection: 'column', alignItems: 'center', gap: 0, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ffffffff', borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  aiButtonTitle: { fontSize: 10, fontFamily: 'Bree', fontWeight: '600', color: '#123530', textTransform: 'lowercase' },
  aiIconContainer: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
