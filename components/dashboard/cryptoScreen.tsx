// CryptoScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { getCryptoQuote, getCryptoHistorical } from '@/services/_fmpApi';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

const CRYPTO_SYMBOLS = ['BTCUSD', 'ETHUSD', 'USDTUSD', 'XRPUSD', 'BNBUSD', 'SOLUSD'];

export default function CryptoScreen() {
  const [quotes, setQuotes] = useState<{ [key: string]: any }>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const screenWidth = Dimensions.get('window').width;
  const chartHeight = 250;
  const chartPadding = 75; // For right-side price bar

  // Fetch quotes for all cryptos
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const fetchedQuotes: { [key: string]: any } = {};
      for (const symbol of CRYPTO_SYMBOLS) {
        const quote = await getCryptoQuote(symbol);
        if (quote) fetchedQuotes[symbol] = quote;
      }
      setQuotes(fetchedQuotes);
      if (CRYPTO_SYMBOLS.length > 0 && !selectedSymbol) setSelectedSymbol(CRYPTO_SYMBOLS[0]);
    } catch (err) {
      console.error('Error fetching crypto quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical data for chart
  const fetchHistorical = async (symbol: string) => {
    try {
      const data = await getCryptoHistorical(symbol);
      if (Array.isArray(data)) {
        setHistoricalData(data.reverse().slice(-50)); // last 50 entries
      }
    } catch (err) {
      console.error('Error fetching historical crypto data:', err);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    if (selectedSymbol) fetchHistorical(selectedSymbol);
  }, [selectedSymbol]);

  // Prepare Skia path
  const getPath = () => {
    if (!historicalData || historicalData.length === 0) return null;

    const path = Skia.Path.Make();
    const prices = historicalData.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const len = historicalData.length;
    const xStep = (screenWidth - chartPadding) / (len - 1);

    historicalData.forEach((d, i) => {
      const x = i * xStep;
      const y = chartHeight - ((d.close - minPrice) / (maxPrice - minPrice)) * chartHeight;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });

    return { path, minPrice, maxPrice };
  };

  const skiaData = getPath();

  return (
    <ScrollView contentContainerStyle={{ padding: 0 }}>
      {/* Chart */}
      <View style={{ flexDirection: 'row', marginBottom: 20, height: chartHeight }}>
        {skiaData && historicalData.length > 0 ? (
          <Canvas style={{ width: screenWidth - chartPadding, height: chartHeight }}>
            <Path path={skiaData.path} color="#5EC385" style="stroke" strokeWidth={2} />
          </Canvas>
        ) : (
          <ActivityIndicator size="large" color="#123530" style={{ flex: 1 }} />
        )}

        {/* Price bar */}
        {skiaData && (
          <View style={{ width: chartPadding, justifyContent: 'space-between', height: chartHeight }}>
            <Text style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>
              {skiaData.maxPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>
              {(((skiaData.maxPrice + skiaData.minPrice) / 2)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>
              {skiaData.minPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}
      </View>

      {/* Crypto Quotes List */}
      <View style={{
        borderWidth: 1,
        borderColor: '#1235301A',
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#fffbf5',
        marginBottom: 25,
      }}>
        {loading ? (
          <ActivityIndicator size="small" color="#123530" style={{ padding: 16 }} />
        ) : CRYPTO_SYMBOLS.map(symbol => {
          const quote = quotes[symbol];
          const price = quote?.price || 0;
          const change = quote?.change || 0;
          const changePercent = quote?.changePercentage || 0;
          const trend = change >= 0;

          return (
            <TouchableOpacity
              key={symbol}
              style={[
                styles.indexButton,
                selectedSymbol === symbol && { backgroundColor: '#12353003' },
              ]}
              onPress={() => setSelectedSymbol(symbol)}
            >
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                paddingHorizontal: 10,
              }}>
                <View style={{ width: 170 }}>
                  <Text style={{ fontWeight: '600', color: '#123530' }}>{symbol}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    {quote?.exchange || 'CRYPTO'}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '600', color: trend ? 'green' : 'red' }}>
                    ${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ fontSize: 12, color: trend ? 'green' : 'red' }}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  indexButton: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1235301A',
    backgroundColor: '#12353003',
  },
});
