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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/theme';
import api from '@/services/_api'; // <-- adjust import if needed

const { width } = Dimensions.get('window');

export default function TodaysOutlookDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // get id from route params
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await api.get(`/market-predictions/${id}`);
        setPrediction(res.data.data); // assuming API returns { data: {...} }
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPrediction();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#123530" />
      </View>
    );
  }

  if (error || !prediction) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>
          {error || 'No data found'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.pageTitle}>{prediction.title}</Text>

      {/* Image */}
      {prediction.image_url && (
        <View style={styles.card}>
          <Image
            source={{
              uri: prediction.image_url.startsWith('http')
                ? prediction.image_url
                : `https://basilstar.com/${prediction.image_url}`,
            }}
            style={styles.cardImage}
          />
        </View>
      )}

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.listText}>{prediction.description}</Text>
      </View>

      {/* Market Sentiment */}
      {prediction.market_sentiment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Sentiment</Text>
          <Text style={styles.listText}>{prediction.market_sentiment}</Text>
        </View>
      )}

      {/* Global Cues */}
      {prediction.global_cues && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Cues</Text>
          <Text style={styles.listText}>{prediction.global_cues}</Text>
        </View>
      )}

      {/* Volatility Alert */}
      {prediction.volatility_alert && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volatility Alert</Text>
          <Text style={styles.listText}>{prediction.volatility_alert}</Text>
        </View>
      )}

      {/* Support/Resistance */}
      {(prediction.support_levels || prediction.resistance_levels) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Resistance</Text>
          <Text style={styles.listText}>
            Support: {prediction.support_levels || '-'}
          </Text>
          <Text style={styles.listText}>
            Resistance: {prediction.resistance_levels || '-'}
          </Text>
        </View>
      )}

      {/* Range */}
      {prediction.range && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Range</Text>
          <Text style={styles.listText}>{prediction.range}</Text>
        </View>
      )}

      {/* Example: Stock Tip */}
      <View style={styles.stockTipCard}>
        <View style={styles.stockHeader}>
          <MaterialIcons name="emoji-events" size={28} color="#ffffff" />
          <Text style={styles.stockTitle}>📈 Stock Tip of the Day</Text>
        </View>
        <Text style={styles.stockName}>{prediction.title}</Text>
        <Text style={styles.stockDetail}>Support: {prediction.support_levels || '-'}</Text>
        <Text style={styles.stockDetail}>Resistance: {prediction.resistance_levels || '-'}</Text>
        {prediction.volatility_alert && (
          <Text style={styles.stockReason}>Note: {prediction.volatility_alert}</Text>
        )}
      </View>

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
    fontSize: 22,
    fontWeight: '700',
    color: '#123530',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#123530',
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
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
  section: {
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  listText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  stockTipCard: {
    backgroundColor: '#123530',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 24,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  stockName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  stockDetail: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  stockReason: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
