// screens/cashFlowTabScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { fetchCashFlowStatement, fetchIncomeStatement } from "@/services/_fmpApi";

type CashFlowTabScreenProps = {
  symbol: string;
};

export default function CashFlowTabScreen({ symbol }: CashFlowTabScreenProps) {
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const cashFlow = await fetchCashFlowStatement(symbol);
      const income = await fetchIncomeStatement(symbol);

      setCashFlowData(cashFlow.reverse()); // oldest -> newest
      setIncomeData(income.reverse());
      setLoading(false);
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (cashFlowData.length === 0) {
    return (
      <View style={styles.loader}>
        <Text>No cash flow data available</Text>
      </View>
    );
  }

  const years = cashFlowData.map((item) => item.fiscalYear);
  const operatingCF = cashFlowData.map((item) => item.netCashProvidedByOperatingActivities / 1_000_000);
  const investingCF = cashFlowData.map((item) => item.netCashProvidedByInvestingActivities / 1_000_000);
  const financingCF = cashFlowData.map((item) => item.netCashProvidedByFinancingActivities / 1_000_000);

  const freeCF = cashFlowData.map((item) => item.freeCashFlow / 1_000_000);
  const netIncome = incomeData.map((item) => item.netIncome / 1_000_000);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.title}>Cash Flow Analysis - {symbol}</Text>

      {/* Cash Flow Bar Chart */}
      <Text style={styles.sectionTitle}>Cash Flow (Operating, Investing, Financing)</Text>
      <BarChart
        data={{
          labels: years,
          datasets: [
            { data: operatingCF },
            { data: investingCF },
            { data: financingCF },
          ],
        }}
        width={Dimensions.get("window").width - 32}
        height={220}
        yAxisLabel="₹"
        yAxisSuffix="M"
        chartConfig={{
          backgroundColor: "#fffbf5",
          backgroundGradientFrom: "#fffbf5",
          backgroundGradientTo: "#fffbf5",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        style={{ marginVertical: 8, borderRadius: 12 }}
        fromZero
        showValuesOnTopOfBars
      />

      {/* Free Cash Flow vs Net Income Line Chart */}
      <Text style={styles.sectionTitle}>Free Cash Flow vs Net Income</Text>
      <LineChart
        data={{
          labels: years,
          datasets: [
            { data: freeCF, color: () => "#28A745", strokeWidth: 2 },
            { data: netIncome, color: () => "#FF5733", strokeWidth: 2 },
          ],
        }}
        width={Dimensions.get("window").width - 32}
        height={220}
        yAxisLabel="₹"
        yAxisSuffix="M"
        chartConfig={{
          backgroundColor: "#fffbf5",
          backgroundGradientFrom: "#fffbf5",
          backgroundGradientTo: "#fffbf5",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          propsForDots: { r: "4", strokeWidth: "2", stroke: "#007AFF" },
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 12 }}
      />

      {/* Data Table */}
      <Text style={styles.sectionTitle}>Cash Flow Table (All Years)</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Year</Text>
          <Text style={styles.tableCell}>Operating CF (₹M)</Text>
          <Text style={styles.tableCell}>Investing CF (₹M)</Text>
          <Text style={styles.tableCell}>Financing CF (₹M)</Text>
          <Text style={styles.tableCell}>Free CF (₹M)</Text>
          <Text style={styles.tableCell}>Net Income (₹M)</Text>
        </View>
        {cashFlowData.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.fiscalYear}</Text>
            <Text style={styles.tableCell}>{formatNumber(item.netCashProvidedByOperatingActivities / 1_000_000)}</Text>
            <Text style={styles.tableCell}>{formatNumber(item.netCashProvidedByInvestingActivities / 1_000_000)}</Text>
            <Text style={styles.tableCell}>{formatNumber(item.netCashProvidedByFinancingActivities / 1_000_000)}</Text>
            <Text style={styles.tableCell}>{formatNumber(item.freeCashFlow / 1_000_000)}</Text>
            <Text style={styles.tableCell}>{formatNumber(netIncome[idx])}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Format numbers
const formatNumber = (num: number) =>
  num !== undefined && num !== null
    ? num.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "-";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffbf5", },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#123530" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, overflow: "hidden" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ccc" },
  tableHeader: { backgroundColor: "#f0f0f0" },
  tableCell: { flex: 1, padding: 6, fontSize: 12, textAlign: "center" },
    section: {
    marginBottom: 12,
    backgroundColor: '#1235301A',
    padding: 12,
    borderRadius: 12,
    height: 250, // fixed height for scrollable sections
  },
});
