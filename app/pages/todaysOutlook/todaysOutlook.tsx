import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Theme from '@/constants/theme';
import { getMarketPredictions } from '@/services/_api';

const { width } = Dimensions.get('window');

export default function TodaysOutlook() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const date = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMarketPredictions();
        setPredictions(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderCard = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/pages/todaysOutlook/todaysOutlookDetails',
          params: { id: item.id },
        })
      }
    >
      <Image
        source={{
          uri: item.image_url
            ? `https://basilstar.com/${item.image_url}`
            : 'https://via.placeholder.com/400x200',
        }}
        style={styles.cardImage}
      />
      <View style={{ padding: 12 }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.cardText} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}
        {item.market_sentiment ? (
          <Text style={styles.cardSentiment}>
            Sentiment: {item.market_sentiment}
          </Text>
        ) : null}
        {item.support_levels || item.resistance_levels ? (
          <Text style={styles.cardLevels}>
            Support: {item.support_levels || '-'} | Resistance:{' '}
            {item.resistance_levels || '-'}
          </Text>
        ) : null}
        {item.range ? (
          <Text style={styles.cardRange}>Range: {item.range}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.pageTitle}>Todays Outlook - {date}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#123530" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={{ color: 'red', marginTop: 20, textAlign: 'center' }}>
          {error}
        </Text>
      ) : predictions.length === 0 ? (
        <Text style={{ marginTop: 20, textAlign: 'center' }}>
          No market predictions available
        </Text>
      ) : (
        predictions.map(renderCard)
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Theme.Colors.light.background || '#fffbf5',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    marginBottom: 16,
    backgroundColor: '#123530',
    padding: 6,
    borderRadius: 8,
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#123530',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: {
    width: width - 32,
    height: 180,
    resizeMode: 'cover',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123530',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  cardSentiment: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2a7',
    marginBottom: 4,
  },
  cardLevels: {
    fontSize: 12,
    color: '#555',
  },
  cardRange: {
    fontSize: 12,
    color: '#111',
    marginTop: 4,
  },
});
