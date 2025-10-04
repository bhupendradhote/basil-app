import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDividends, getSplits } from '@/services/_fmpApi'; // ✅ new API functions

type Props = { symbol: string };

type Dividend = {
  date: string;
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
  adjDividend: number;
  dividend: number;
  yield: number;
  frequency: string;
};

type Split = {
  date: string;
  numerator: number;
  denominator: number;
};

export default function CorporateActionsScreen({ symbol }: Props) {
  const [loading, setLoading] = useState(false);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const dividendData = await getDividends(symbol);
        setDividends(dividendData || []);

        const splitData = await getSplits(symbol);
        setSplits(splitData || []);
      } catch (err) {
        console.error('Error fetching corporate actions:', err);
        setDividends([]);
        setSplits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading)
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#123530" style={{ marginTop: 20 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Dividends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dividends</Text>
          <ScrollView style={styles.innerScroll}>
            {dividends.length === 0 ? (
              <Text style={styles.emptyText}>No dividend data available.</Text>
            ) : (
              dividends.map((d, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.date}>{d.date}</Text>
                  <Text>Dividend: ₹{d.dividend.toFixed(2)}</Text>
                  <Text>Adj Dividend: {d.adjDividend.toFixed(2)}</Text>
                  <Text>Yield: {(d.yield * 100).toFixed(2)}%</Text>
                  <Text>Frequency: {d.frequency}</Text>
                  <Text>Declaration Date: {d.declarationDate}</Text>
                  <Text>Record Date: {d.recordDate}</Text>
                  <Text>Payment Date: {d.paymentDate}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Splits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Splits</Text>
          <ScrollView style={styles.innerScroll}>
            {splits.length === 0 ? (
              <Text style={styles.emptyText}>No split data available.</Text>
            ) : (
              splits.map((s, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.date}>{s.date}</Text>
                  <Text>Split Ratio: {s.numerator}:{s.denominator}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { padding: 0, paddingBottom: 0 },
  section: {
    marginBottom: 12,
    backgroundColor: '#1235301A',
    padding: 12,
    borderRadius: 12,
    height: 250, // fixed height for scrollable sections
  },
  innerScroll: { flexGrow: 0 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 10 },
  row: { marginBottom: 12, borderBottomWidth: 0.5, paddingBottom: 12, borderBottomColor: "#00000033" },
  date: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#888' },
});

