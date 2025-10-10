import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { getHistoricalEOD, getQuote } from "@/services/_fmpApi";
import Theme from "@/constants/theme";

type Props = { symbol: string; };

type EOD = { date: string; close: number; };

type Quote = {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  change: number;
  volume: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  open: number;
  previousClose: number;
};

type LastDay = { date: string; close: number; changePerc: number; };

export default function OverviewTabScreen({ symbol }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EOD[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [last24Days, setLast24Days] = useState<LastDay[]>([]);
  const [sentiment, setSentiment] = useState({
    upDays: 0,
    downDays: 0,
    neutralDays: 0,
    avgChange: 0,
    overall: "",
  });

  const chartWidth = 270;
  const chartHeight = 250;

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const eodRes = await getHistoricalEOD(symbol);
        if (Array.isArray(eodRes)) {
          const sortedEOD = eodRes.slice(0, 50).reverse();
          setData(sortedEOD);

          const last24: LastDay[] = [];
          for (let i = 1; i <= 24 && i < sortedEOD.length; i++) {
            const prev = sortedEOD[i - 1];
            const curr = sortedEOD[i];
            const changePerc = ((curr.close - prev.close) / prev.close) * 100;
            last24.push({ date: curr.date, close: curr.close, changePerc });
          }
          setLast24Days(last24);

          const upDays = last24.filter(d => d.changePerc > 0).length;
          const downDays = last24.filter(d => d.changePerc < 0).length;
          const neutralDays = last24.filter(d => d.changePerc === 0).length;
          const avgChange = last24.reduce((sum, d) => sum + d.changePerc, 0) / last24.length;

          let overall = "";
          if (avgChange > 0.2) overall = "Bullish";
          else if (avgChange < -0.2) overall = "Bearish";
          else overall = "Neutral";

          setSentiment({ upDays, downDays, neutralDays, avgChange, overall });
        }

        const quoteRes = await getQuote(symbol);
        setQuote(quoteRes);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) return <SafeAreaView style={styles.loader}><ActivityIndicator size="large" color="#123530" /></SafeAreaView>;
  if (!data.length || !quote) return <SafeAreaView style={styles.empty}><Text>No data available.</Text></SafeAreaView>;

  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const directionUp = prices[prices.length - 1] >= prices[0];
  const lineColor = directionUp ? "#00b894" : "#d63031";

  const scaleY = (price: number) => chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
  const scaleX = (index: number) => (index / (data.length - 1)) * chartWidth;

  const path = Skia.Path.Make();
  data.forEach((d, i) => {
    const x = scaleX(i);
    const y = scaleY(d.close);
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });

  const labelCount = 5;
  const priceLabels = Array.from({ length: labelCount }, (_, i) =>
    (minPrice + ((maxPrice - minPrice) * i) / (labelCount - 1)).toFixed(2)
  );

  const quoteData = [
    { label: "Name", value: quote.name },
    { label: "Price", value: `₹${quote.price.toFixed(2)}` },
    { label: "Change", value: `${quote.change.toFixed(2)} (${quote.changePercentage.toFixed(2)}%)`, color: quote.change >= 0 ? "#00b894" : "#d63031" },
    { label: "Open", value: `₹${quote.open.toFixed(2)}` },
    { label: "Previous Close", value: `₹${quote.previousClose.toFixed(2)}` },
    { label: "Day Low", value: `₹${quote.dayLow.toFixed(2)}` },
    { label: "Day High", value: `₹${quote.dayHigh.toFixed(2)}` },
    { label: "52W Low", value: `₹${quote.yearLow.toFixed(2)}` },
    { label: "52W High", value: `₹${quote.yearHigh.toFixed(2)}` },
    { label: "Market Cap", value: `${(quote.marketCap / 1e9).toFixed(2)} B` },
    { label: "50D Avg", value: `₹${quote.priceAvg50.toFixed(2)}` },
    { label: "200D Avg", value: `₹${quote.priceAvg200.toFixed(2)}` },
    { label: "Exchange", value: quote.exchange },
    { label: "Volume", value: quote.volume.toLocaleString() },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false} // Hide vertical scroll bar
      >
        {/* Chart */}
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View>
            <Text style={styles.title}>{symbol}</Text>
            <Canvas style={{ width: chartWidth, height: chartHeight }}>
              <Path path={path} color={lineColor} style="stroke" strokeWidth={2} />
            </Canvas>
          </View>
          <View style={{ marginLeft: 8, justifyContent: "space-between", height: chartHeight }}>
            {priceLabels.reverse().map((p, i) => (
              <Text key={i} style={{ fontSize: 12, color: "#333" }}>
                ₹{p}
              </Text>
            ))}
          </View>
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          {quoteData.map((q, idx) => (
            <View key={idx} style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>{q.label}</Text>
              <Text style={[styles.quoteValue, { color: q.color || "#333" }]}>{q.value}</Text>
            </View>
          ))}
        </View>

        {/* Last 24 Days Historical */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Past 24 Days</Text>
          {last24Days.map((d, idx) => (
            <View key={idx} style={styles.historyRow}>
              <Text style={styles.historyDate}>{d.date}</Text>
              <View style={styles.historyValues}>
                <Text style={styles.historyClose}>Close: ₹{d.close.toFixed(2)}</Text>
                <Text style={[styles.historyChange, { color: d.changePerc >= 0 ? "#00b894" : "#d63031" }]}>
                  % change: {d.changePerc.toFixed(2)}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Market Sentiment */}
        <View style={styles.sentimentContainer}>
          <Text style={styles.sentimentTitle}>Market Sentiment (Last 24 Days)</Text>
          <Text>Up Days: {sentiment.upDays}</Text>
          <Text>Down Days: {sentiment.downDays}</Text>
          <Text>Neutral Days: {sentiment.neutralDays}</Text>
          <Text>Average % Change: {sentiment.avgChange.toFixed(2)}%</Text>
          <Text>Overall Sentiment: {sentiment.overall}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.Colors.light.background || '#fffbf5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...Theme.Typography.subheading, textAlign: "center", marginBottom: 8 },
  empty: { fontSize: 14, padding: 0, textAlign: "center" },
  quoteContainer: { marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: "#f2f2f2" },
  quoteRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#00000033" },
  quoteLabel: { fontSize: 14, fontWeight: "500", paddingVertical: 4 },
  quoteValue: { fontSize: 14, fontWeight: "600", paddingVertical: 4 },
  historyContainer: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: "#f2f2f2" },
  historyTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  historyRow: { marginBottom: 8, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#00000033" },
  historyValues: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  historyDate: { fontSize: 14, fontWeight: "500" },
  historyClose: { fontSize: 14 },
  historyChange: { fontSize: 14, fontWeight: "600" },
  sentimentContainer: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: "#f2f2f2" },
  sentimentTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
});
