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

export default function DailyTrades() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const date = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMarketPredictions();
        setPredictions(data || []);
      } catch (err: any) {
        console.error('Error fetching predictions:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderCard = (item: any, index: number) => (
    <TouchableOpacity
      key={index.toString()}
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/pages/todaysOutlook/todaysOutlookDetails',
          params: { id: item.id },
        })
      }
      activeOpacity={0.9}
    >
      <Image
        source={{
          uri: item.image_url
            ? `https://basilstar.com/${item.image_url}`
            : 'https://via.placeholder.com/400x200?text=No+Image',
        }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>

        {item.description ? (
          <Text style={styles.cardText} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}

        {item.market_sentiment ? (
          <Text
            style={[
              styles.cardSentiment,
              {
                color:
                  item.market_sentiment.toLowerCase() === 'bullish'
                    ? '#2a7'
                    : item.market_sentiment.toLowerCase() === 'bearish'
                    ? '#d33'
                    : '#666',
              },
            ]}
          >
            Sentiment: {item.market_sentiment}
          </Text>
        ) : null}

        {(item.support_levels || item.resistance_levels) && (
          <Text style={styles.cardLevels}>
            Support: {item.support_levels || '-'} | Resistance:{' '}
            {item.resistance_levels || '-'}
          </Text>
        )}

        {item.range ? (
          <Text style={styles.cardRange}>Range: {item.range}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
  

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#123530"
          style={{ marginTop: 40 }}
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : predictions.length === 0 ? (
        <Text style={styles.noDataText}>
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
    padding: 0,
    backgroundColor: Theme.Colors?.light?.background || '#fffbf5',
    paddingTop: 0,
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
  cardContent: {
    padding: 12,
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
  errorText: {
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
  noDataText: {
    marginTop: 20,
    textAlign: 'center',
  },
});
