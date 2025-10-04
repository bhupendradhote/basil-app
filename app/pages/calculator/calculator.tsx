import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Theme from '@/constants/theme';

export default function Calculator() {
  const router = useRouter();

  const [currencyPair] = useState('EURUSD');
  const [positionType, setPositionType] = useState<'Long' | 'Short'>('Long');
  const [openPrice, setOpenPrice] = useState('');
  const [closePrice, setClosePrice] = useState('');
  const [lots, setLots] = useState('');
  const [results, setResults] = useState<{
    money: number;
    units: number;
    sizing: number;
  } | null>(null);

  // Helper to parse inputs
  const parseNum = (v: string) => Number(v.replace(',', '.'));

  const calculate = () => {
    const op = parseNum(openPrice);
    const cp = parseNum(closePrice);
    const lt = parseNum(lots);

    if (!op || !cp || !lt || isNaN(op) || isNaN(cp) || isNaN(lt)) {
      Alert.alert('Invalid input', 'Enter valid numbers for every field.');
      return;
    }

    // Standard forex lot size: 100,000 units
    const totalUnits = lt * 100000;
    // Money P/L: (close - open) * units (long), (open - close) * units (short)
    const priceDiff = positionType === 'Long' ? cp - op : op - cp;
    const money = priceDiff * totalUnits; // USD

    setResults({
      money,
      units: totalUnits,
      sizing: lt,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={28} color="#123530" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Position size calculator</Text>
      </View>

      {/* Main Section */}
      <View style={styles.box}>
        <Text style={styles.label}>Currency Pair</Text>
        <TextInput
          value={currencyPair}
          style={[styles.input, { backgroundColor: '#e0e0dc' }]}
          editable={false}
        />
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.tab, positionType === 'Long' && styles.tabSelected]}
            onPress={() => setPositionType('Long')}
          >
            <Text style={[styles.tabText, positionType === 'Long' && styles.tabTextSelected]}>
              Long
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, positionType === 'Short' && styles.tabSelected, styles.tabNotSelected]}
            onPress={() => setPositionType('Short')}
          >
            <Text style={[styles.tabText, positionType === 'Short' && styles.tabTextSelected]}>
              Analyze
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="Enter Open Price"
          style={styles.input}
          keyboardType="numeric"
          value={openPrice}
          onChangeText={setOpenPrice}
          placeholderTextColor="#bbb"
        />
        <TextInput
          placeholder="Enter Close Price"
          style={styles.input}
          keyboardType="numeric"
          value={closePrice}
          onChangeText={setClosePrice}
          placeholderTextColor="#bbb"
        />
        <TextInput
          placeholder="Enter Lots (Example 0.001)"
          style={styles.input}
          keyboardType="numeric"
          value={lots}
          onChangeText={setLots}
          placeholderTextColor="#bbb"
        />
        <TouchableOpacity style={styles.calculateBtn} onPress={calculate}>
          <Text style={styles.calculateText}>Calculate</Text>
        </TouchableOpacity>
        <View />
        {/* Results */}
        {results && (
          <View style={styles.resultsBox}>
            <Text style={styles.resultsTitle}>Results</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Money, USD:</Text>
              <Text style={styles.resultValue}>
                ${results.money.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Units:</Text>
              <Text style={styles.resultValue}>{results.units}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Sizing:</Text>
              <Text style={styles.resultValue}>{results.sizing} lots</Text>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f2', // Very light cream
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 8,
  },
  back: {
    marginRight: 8,
    padding: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#123530',
    marginLeft: 0,
  },
  box: {
    backgroundColor: '#f4f3eb',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.025,
    shadowRadius: 8,
    elevation: 1,
  },
  label: {
    fontSize: 15,
    color: '#123530',
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 0,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 14,
    color: '#123530',
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 6,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#123530',
    marginRight: 7,
  },
  tabNotSelected: {
    marginRight: 0,
    marginLeft: 0,
  },
  tabSelected: {
    backgroundColor: '#123530',
    borderColor: '#123530',
  },
  tabText: {
    color: '#123530',
    fontWeight: '600',
    fontSize: 16,
  },
  tabTextSelected: {
    color: '#fff',
  },
  calculateBtn: {
    backgroundColor: '#123530',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  calculateText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
  },
  resultsBox: {
    marginTop: 18,
    backgroundColor: '#efede2',
    borderRadius: 14,
    padding: 14,
    paddingBottom: 10,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#123530',
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultLabel: {
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
  resultValue: {
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
});
