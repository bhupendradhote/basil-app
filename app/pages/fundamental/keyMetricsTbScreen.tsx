// screens/keyMetricsTbScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { getKeyMetrics } from "@/services/_fmpApi";

type KeyMetricsTbScreenProps = {
  symbol: string;
};

export default function KeyMetricsTbScreen({ symbol }: KeyMetricsTbScreenProps) {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await getKeyMetrics(symbol);
        if (Array.isArray(data) && data.length > 0) {
          setMetrics(data[0]); // latest metrics
        }
      } catch (err) {
        console.error("Key Metrics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [symbol]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.loader}>
        <Text>No key metrics available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Key Metrics - {symbol}</Text>

        {/* General Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Market Data</Text>
          <Row label="Date" value={metrics.date} />
          <Row label="Fiscal Year" value={metrics.fiscalYear} />
          <Row label="Period" value={metrics.period} />
          <Row label="Currency" value={metrics.reportedCurrency} />
        </View>

        {/* Valuation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valuation</Text>
          <Row label="Market Cap" value={formatNumber(metrics.marketCap)} />
          <Row label="Enterprise Value" value={formatNumber(metrics.enterpriseValue)} />
          <Row label="EV / Sales" value={metrics.evToSales} />
          <Row label="EV / EBITDA" value={metrics.evToEBITDA} />
          <Row label="EV / Free Cash Flow" value={metrics.evToFreeCashFlow} />
        </View>

        {/* Returns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Returns</Text>
          <Row label="ROA" value={toPercent(metrics.returnOnAssets)} />
          <Row label="ROE" value={toPercent(metrics.returnOnEquity)} />
          <Row label="ROIC" value={toPercent(metrics.returnOnInvestedCapital)} />
          <Row label="ROCE" value={toPercent(metrics.returnOnCapitalEmployed)} />
        </View>

        {/* Cash Flow */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash Flow</Text>
          <Row label="Free Cash Flow Yield" value={toPercent(metrics.freeCashFlowYield)} />
          <Row label="Operating Cash Flow / EV" value={metrics.evToOperatingCashFlow} />
          <Row label="Capex to Revenue" value={toPercent(metrics.capexToRevenue)} />
          <Row label="Free Cash Flow to Equity" value={formatNumber(metrics.freeCashFlowToEquity)} />
        </View>

        {/* Efficiency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Efficiency</Text>
          <Row label="Current Ratio" value={metrics.currentRatio} />
          <Row label="Income Quality" value={metrics.incomeQuality} />
          <Row label="Operating Cycle" value={metrics.operatingCycle} />
          <Row label="Cash Conversion Cycle" value={metrics.cashConversionCycle} />
          <Row label="Days of Inventory Outstanding" value={metrics.daysOfInventoryOutstanding} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Row component
const Row = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value ?? "-"}</Text>
  </View>
);

// Format helpers
const formatNumber = (num: number) =>
  num ? num.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "-";

const toPercent = (val: number) =>
  val !== undefined ? `${(val * 100).toFixed(2)}%` : "-";

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 16, color: "#123530" },
  section: {
    marginBottom: 16,
    backgroundColor: "#1235300D",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1235301A",
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 14, fontWeight: "500", color: "#333" },
  value: { fontSize: 14, color: "#000" },
});
