import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { Canvas, Path, Skia, vec } from '@shopify/react-native-skia';
import { getIntradayChart, getHistoricalEOD } from '@/services/_fmpApi';
import axios from 'axios';
import { TileMode } from '@shopify/react-native-skia';

const screenWidth = Dimensions.get('window').width;
const chartHeight = 200;

type Interval = '5min' | '1hour' | '1d';

const INDEXES = [
  { name: 'NIFTY 50', symbol: '^NSEI', market: 'NSE' },
  { name: 'NIFTY BANK', symbol: '^NSEBANK', market: 'NSE' },
  { name: 'SENSEX', symbol: '^BSESN', market: 'BSE' },
];

const FMP_BATCH_QUOTE_URL = `https://financialmodelingprep.com/stable/batch-index-quotes?apikey=pNfPaAqCCLW5TIyeNfmbJ9CaocjvSfNb`;

export default function IndexChart() {
  const [interval, setInterval] = useState<Interval>('5min'); // default 5min
  const [chartsData, setChartsData] = useState<Record<string, number[]>>({});
  const [chartsLabels, setChartsLabels] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<
    { symbol: string; price: number; change: number; changePercent: number; trendUp: boolean }[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState<string>('^NSEI'); // initially NIFTY 50

  useEffect(() => {
    fetchAllQuotes();
  }, []);

  useEffect(() => {
    fetchChart(selectedIndex, interval);
  }, [interval, selectedIndex]);

  const fetchAllQuotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(FMP_BATCH_QUOTE_URL);

      if (response.data && Array.isArray(response.data)) {
        const data = INDEXES.map(index => {
          const quote = response.data.find((q: any) => q.symbol === index.symbol);
          if (!quote)
            return {
              symbol: index.symbol,
              price: 0,
              change: 0,
              changePercent: 0,
              trendUp: true,
            };

          const changePercent =
            quote.price - quote.change !== 0 ? (quote.change / (quote.price - quote.change)) * 100 : 0;

          return {
            symbol: index.symbol,
            price: quote.price ?? 0,
            change: quote.change ?? 0,
            changePercent,
            trendUp: quote.change >= 0,
          };
        });

        setQuotes(data);
      }
    } catch (e) {
      console.error('Error fetching quotes:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async (symbol: string, selectedInterval: Interval) => {
    try {
      let chartData: any[] = [];

      if (selectedInterval === '1d') {
        const response = await getHistoricalEOD(symbol);
        chartData = response.slice(-50);
      } else {
        chartData = await getIntradayChart(symbol, selectedInterval);
      }

      if (!chartData || chartData.length === 0) return;

      const sorted = chartData.reverse();
      const prices = sorted.map(d => d.close);
      const lbls = sorted.map(d => (selectedInterval === '1d' ? d.date : d.date.slice(11, 16)));

      setChartsData(prev => ({ ...prev, [symbol]: prices }));
      setChartsLabels(prev => ({ ...prev, [symbol]: lbls }));
    } catch (e) {
      console.error(`Error fetching chart for ${symbol}:`, e);
    }
  };

  const currentQuote =
    quotes.find(q => q.symbol === selectedIndex) ?? {
      symbol: selectedIndex,
      price: 0,
      change: 0,
      changePercent: 0,
      trendUp: true,
    };

  const data = chartsData[selectedIndex] || [];
  const trendUp = currentQuote.trendUp;

  if (loading) return <ActivityIndicator size="small" color="#123530" />;

  const max = data.length ? Math.max(...data) : 0;
  const min = data.length ? Math.min(...data) : 0;
  const mid = (max + min) / 2;

  const linePath = Skia.Path.Make();
  data.forEach((y, i) => {
    const x = (i / (data.length - 1 || 1)) * (screenWidth - 40);
    const scaledY = ((max - y) / (max - min || 1)) * chartHeight;
    i === 0 ? linePath.moveTo(x, scaledY) : linePath.lineTo(x, scaledY);
  });

  const fillPath = linePath.copy();
  fillPath.lineTo(screenWidth - 40, chartHeight);
  fillPath.lineTo(0, chartHeight);
  fillPath.close();

  const gradientPaint = Skia.Paint();
  gradientPaint.setShader(
    Skia.Shader.MakeLinearGradient(
      vec(0, 0),
      vec(0, chartHeight),
      trendUp
        ? [Skia.Color('#dff6e0'), Skia.Color('rgba(255,255,255,0)')]
        : [Skia.Color('#ffe3e3'), Skia.Color('rgba(255,255,255,0)')],
      null,
      TileMode.Clamp
    )
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 0 }}>
      {/* Chart Container */}
      <View style={{ marginBottom: 20, backgroundColor: '#fffbf5', borderRadius: 12, padding: 10 }}>
        {/* Index Info Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#123530' }}>
              {INDEXES.find(i => i.symbol === selectedIndex)?.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {INDEXES.find(i => i.symbol === selectedIndex)?.market}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#123530' }}>
              ₹{currentQuote.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={{ fontSize: 12, color: trendUp ? 'green' : 'red' }}>
              {currentQuote.change >= 0 ? '+' : ''}
              {currentQuote.change.toFixed(2)} ({currentQuote.changePercent >= 0 ? '+' : ''}
              {currentQuote.changePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['1hour', '5min'] as Interval[]).map(i => (
            <TouchableOpacity
              key={i}
              style={[styles.tabButton, interval === i && styles.tabActive]}
              onPress={() => setInterval(i)}
            >
              <Text style={[styles.tabText, interval === i && styles.tabTextActive]}>{i.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Canvas style={{ width: screenWidth - 90, height: chartHeight }}>
            <Path path={fillPath} style="fill" paint={gradientPaint} />
            <Path path={linePath} style="stroke" color={trendUp ? 'green' : 'red'} strokeWidth={2} />
          </Canvas>
          <View style={{ marginLeft: 5, justifyContent: 'space-between', height: chartHeight }}>
            <Text style={{ fontSize: 10, color: '#123530' }}>{max.toFixed(2)}</Text>
            <Text style={{ fontSize: 10, color: '#123530' }}>{mid.toFixed(2)}</Text>
            <Text style={{ fontSize: 10, color: '#123530' }}>{min.toFixed(2)}</Text>
            <Text style={{ fontSize: 10, color: '#123530' }}>{mid.toFixed(2)}</Text>
            <Text style={{ fontSize: 10, color: '#123530' }}>{min.toFixed(2)}</Text>
            <Text style={{ fontSize: 10, color: '#123530' }}>{mid.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Vertical Index List */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#1235301A',
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: '#fffbf5',
          marginBottom: 25,
        }}
      >
        {INDEXES.map(index => {
          const quote =
            quotes.find(q => q.symbol === index.symbol) ?? {
              symbol: index.symbol,
              price: 0,
              change: 0,
              changePercent: 0,
              trendUp: true,
            };
          const trend = quote.trendUp;

          return (
            <TouchableOpacity
              key={index.symbol}
              style={[
                styles.indexButton,
                selectedIndex === index.symbol && { backgroundColor: '#f0f0f0' },
              ]}
              onPress={() => setSelectedIndex(index.symbol)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                  paddingHorizontal: 10,
                }}
              >
                <View>
                  <Text style={{ fontWeight: '600', color: '#123530' }}>{index.name}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{index.market}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '600', color: trend ? 'green' : 'red' }}>
                    ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ fontSize: 12, color: trend ? 'green' : 'red' }}>
                    {quote.change >= 0 ? '+' : ''}
                    {quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}
                    {quote.changePercent.toFixed(2)}%)
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
  tabsContainer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 10 },
  tabButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#5EC385' },
  tabText: { fontSize: 10, color: '#123530', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  indexButton: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1235301A',
    backgroundColor: '#12353003',
  },
});
