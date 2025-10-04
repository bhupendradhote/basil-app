// screens/technicalAnalysisTabScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SMA,
  RSI,
  Stochastic,
  WilliamsR,
  MACD,
  CCI,
  ROC,
  BollingerBands,
  ATR,
  OBV,
} from "technicalindicators";
import { getHistoricalEOD } from "@/services/_fmpApi";

type TechnicalAnalysisTabScreenProps = {
  symbol: string;
};

export default function TechnicalAnalysisTabScreen({ symbol }: TechnicalAnalysisTabScreenProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any | null>(null);

  useEffect(() => {
    const fetchOHLCV = async () => {
      try {
        setLoading(true);
        const data = await getHistoricalEOD(symbol);

        if (!data || data.length === 0) throw new Error("No OHLCV data");

        const closes = data.map((d: any) => d.close);
        const highs = data.map((d: any) => d.high);
        const lows = data.map((d: any) => d.low);
        const volumes = data.map((d: any) => d.volume);
        const latestPrice = closes[closes.length - 1];

        const safeLast = (arr: any[]) => arr && arr.length > 0 ? arr[arr.length - 1] : null;

        // Moving Averages
        const ma20 = SMA.calculate({ period: 20, values: closes });
        const ma50 = SMA.calculate({ period: 50, values: closes });
        const ma100 = SMA.calculate({ period: 100, values: closes });
        const ma200 = SMA.calculate({ period: 200, values: closes });
        const getMAStatus = (price: number, ma: number | null) => {
          if (ma === null) return { ma: null, diffPercent: 0, status: "N/A" };
          const diffPercent = ((price - ma) / ma) * 100;
          return { ma, diffPercent, status: diffPercent >= 0 ? "Above" : "Below" };
        };

        // Momentum Oscillators
        const rsi14 = RSI.calculate({ period: 14, values: closes });
        const latestRSI = safeLast(rsi14);
        const rsiSignal = latestRSI !== null ? (latestRSI > 70 ? "Sell" : latestRSI < 30 ? "Buy" : "Neutral") : "N/A";

        const stochRSI14 = Stochastic.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: 14,
          signalPeriod: 3,
        });
        const latestStochRSI = safeLast(stochRSI14)?.k ? safeLast(stochRSI14).k * 100 : null;
        const stochSignal = latestStochRSI !== null ? (latestStochRSI > 80 ? "Sell" : latestStochRSI < 20 ? "Buy" : "Neutral") : "N/A";

        const williamsR = WilliamsR.calculate({ high: highs, low: lows, close: closes, period: 14 });
        const latestWR = safeLast(williamsR);
        const wrSignal = latestWR !== null ? (latestWR > -20 ? "Sell" : latestWR < -80 ? "Buy" : "Neutral") : "N/A";

        // Trend Oscillators
        const macdInput = { values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false };
        const macdArr = MACD.calculate(macdInput);
        const latestMACD = safeLast(macdArr);
        const macdSignal = latestMACD ? (latestMACD.MACD > latestMACD.signal ? "Buy" : "Sell") : "N/A";

        const cciArr = CCI.calculate({ period: 14, high: highs, low: lows, close: closes });
        const latestCCI = safeLast(cciArr);
        const cciSignal = latestCCI !== null ? (latestCCI > 100 ? "Sell" : latestCCI < -100 ? "Buy" : "Neutral") : "N/A";

        const rocArr = ROC.calculate({ period: 12, values: closes });
        const latestROC = safeLast(rocArr);
        const rocSignal = latestROC !== null ? (latestROC > 0 ? "Buy" : latestROC < 0 ? "Sell" : "Neutral") : "N/A";

        // Market Analysis
        const bbArr = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });
        const latestBB = safeLast(bbArr);
        const atrArr = ATR.calculate({ period: 14, high: highs, low: lows, close: closes });
        const latestATR = safeLast(atrArr);
        const obvArr = OBV.calculate({ close: closes, volume: volumes });
        const latestOBV = safeLast(obvArr);

        const latestCandlePattern = "Dark Cloud Cover (Bearish Reversal)";

        setAnalysis({
          latestPrice,
          ma20: getMAStatus(latestPrice, safeLast(ma20)),
          ma50: getMAStatus(latestPrice, safeLast(ma50)),
          ma100: getMAStatus(latestPrice, safeLast(ma100)),
          ma200: getMAStatus(latestPrice, safeLast(ma200)),
          momentum: {
            rsi: { value: latestRSI, signal: rsiSignal },
            stochRSI: { value: latestStochRSI, signal: stochSignal },
            williamsR: { value: latestWR, signal: wrSignal },
          },
          trend: {
            macd: { value: latestMACD?.MACD ?? null, signal: macdSignal },
            stochRSI: { value: latestStochRSI ?? null, signal: stochSignal },
            cci: { value: latestCCI ?? null, signal: cciSignal },
            roc: { value: latestROC ?? null, signal: rocSignal },
          },
          market: {
            bb: latestBB,
            atr: latestATR,
            obv: latestOBV,
            latestCandlePattern,
          },
        });
      } catch (err) {
        console.error("OHLCV fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOHLCV();
  }, [symbol]);

  if (loading || !analysis) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  const getColor = (signal: string) =>
    signal === "Buy" ? "#28A745" : signal === "Sell" ? "#FF3B30" : "#6C757D";

  const formatValue = (val: number | null) => (val !== null ? val.toFixed(2) : "-");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Technical Analysis - {symbol}</Text>

        {/* Moving Averages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moving Averages</Text>
          {["ma20", "ma50", "ma100", "ma200"].map((key) => (
            <View style={styles.row} key={key}>
              <Text style={styles.label}>{key.toUpperCase()}:</Text>
              <Text style={[styles.value, { color: analysis[key].diffPercent >= 0 ? "#28A745" : "#FF3B30" }]}>
                {formatValue(analysis[key].diffPercent)}% {analysis[key].status} the {key.toUpperCase()} moving.
              </Text>
            </View>
          ))}
        </View>

        {/* Momentum Oscillators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Momentum Oscillators</Text>
          {Object.entries(analysis.momentum).map(([key, val]: any) => (
            <View style={styles.row} key={key}>
              <Text style={styles.label}>{key.toUpperCase()}:</Text>
              <Text style={[styles.value, { color: getColor(val.signal) }]}>{val.signal}</Text>
              <Text style={styles.value}>{formatValue(val.value)}</Text>
            </View>
          ))}
        </View>

        {/* Trend Oscillators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trend Oscillators</Text>
          {Object.entries(analysis.trend).map(([key, val]: any) => (
            <View style={styles.row} key={key}>
              <Text style={styles.label}>{key.toUpperCase()}:</Text>
              <Text style={[styles.value, { color: getColor(val.signal) }]}>{val.signal}</Text>
              <Text style={styles.value}>{formatValue(val.value)}</Text>
            </View>
          ))}
        </View>

        {/* Market Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Analysis</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Bollinger Bands (20):</Text>
            <Text style={styles.value}>
              Upper: {formatValue(analysis.market.bb?.upper)}, Lower: {formatValue(analysis.market.bb?.lower)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ATR (14):</Text>
            <Text style={styles.value}>{formatValue(analysis.market.atr)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>OBV:</Text>
            <Text style={styles.value}>{analysis.market.obv ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Latest Candle:</Text>
            <Text style={styles.value}>{analysis.market.latestCandlePattern}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffbf5", },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#123530" },
  section: { marginBottom: 12, padding: 12, backgroundColor: "#1235301A", borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, alignItems: "center" },
  label: { fontSize: 14, fontWeight: "500", color: "#333", width: 150 },
  value: { fontSize: 14, color: "#000", flexShrink: 1, textAlign: "right", width: 120 },
});
