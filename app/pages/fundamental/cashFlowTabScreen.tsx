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
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, LineChart } from "react-native-chart-kit";
import { fetchCashFlowStatement, fetchIncomeStatement } from "@/services/_fmpApi";

type CashFlowTabScreenProps = {
  symbol: string;
};

const USD_TO_INR = 83;

const CHART_COLORS = {
  operating: "#007AFF",
  investing: "#FF3B30",
  financing: "#FFC107",
  freeCF: "#28A745",
  netIncome: "#FF5733",
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
      setCashFlowData(cashFlow.reverse()); // oldest → newest
      setIncomeData(income.reverse());
      setLoading(false);
    };
    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (cashFlowData.length === 0) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text>No Cash Flow data available</Text>
      </SafeAreaView>
    );
  }

  const screenWidth = Dimensions.get("window").width - 32;

  // Convert all values to ₹ Crore
  const toCrore = (value: number | undefined) =>
    value ? (value * USD_TO_INR) / 1e7 : 0;

  const years = cashFlowData.map((item) => item.fiscalYear);
  const operatingCF = cashFlowData.map((i) => toCrore(i.netCashProvidedByOperatingActivities));
  const investingCF = cashFlowData.map((i) => toCrore(i.netCashProvidedByInvestingActivities));
  const financingCF = cashFlowData.map((i) => toCrore(i.netCashProvidedByFinancingActivities));
  const freeCF = cashFlowData.map((i) => toCrore(i.freeCashFlow));
  const netIncome = incomeData.map((i) => toCrore(i.netIncome));

  const formatNumber = (num: number) =>
    num ? num.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "-";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Cash Flow Analysis - {symbol}</Text>

        {/* --- Cash Flow Bar Chart --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Cash Flow Overview (₹ Crore)
          </Text>
          <BarChart
            data={{
              labels: years,
              datasets: [
                { data: operatingCF, color: () => CHART_COLORS.operating },
                { data: investingCF, color: () => CHART_COLORS.investing },
                { data: financingCF, color: () => CHART_COLORS.financing },
              ],
            }}
            width={screenWidth}
            height={250}
            yAxisLabel="₹"
            yAxisSuffix=" Cr"
            fromZero
            showValuesOnTopOfBars
            chartConfig={{
              backgroundGradientFrom: "#f0f0f0",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              labelColor: () => "#333",
              barPercentage: 0.8,
            }}
            style={styles.chartStyle}
          />
          <View style={styles.legendContainer}>
            <LegendItem color={CHART_COLORS.operating} label="Operating CF" />
            <LegendItem color={CHART_COLORS.investing} label="Investing CF" />
            <LegendItem color={CHART_COLORS.financing} label="Financing CF" />
          </View>
        </View>

        {/* --- Free Cash Flow vs Net Income --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free Cash Flow vs Net Income</Text>
          <LineChart
            data={{
              labels: years,
              datasets: [
                {
                  data: freeCF,
                  color: () => CHART_COLORS.freeCF,
                  strokeWidth: 2,
                },
                {
                  data: netIncome,
                  color: () => CHART_COLORS.netIncome,
                  strokeWidth: 2,
                },
              ],
              legend: ["Free Cash Flow (₹ Cr)", "Net Income (₹ Cr)"],
            }}
            width={screenWidth}
            height={250}
            yAxisLabel="₹"
            yAxisSuffix=" Cr"
            bezier
            chartConfig={{
              backgroundGradientFrom: "#f0f0f0",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              labelColor: () => "#333",
              propsForDots: { r: "4", strokeWidth: "2", stroke: "#007AFF" },
            }}
            style={styles.chartStyle}
          />
          <View style={styles.legendContainer}>
            <LegendItem color={CHART_COLORS.freeCF} label="Free CF" />
            <LegendItem color={CHART_COLORS.netIncome} label="Net Income" />
          </View>
        </View>

        {/* --- Table --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash Flow Summary (₹ Crore)</Text>
          <ScrollView horizontal>
            <View>
              <View style={[styles.row, styles.headerRow]}>
                {[
                  "Year",
                  "Operating CF",
                  "Investing CF",
                  "Financing CF",
                  "Free CF",
                  "Net Income",
                ].map((h) => (
                  <Text key={h} style={[styles.cell, styles.headerCell]}>
                    {h}
                  </Text>
                ))}
              </View>

              {cashFlowData.map((item, idx) => (
                <View style={styles.row} key={idx}>
                  <Text style={[styles.cell, styles.labelCell]}>
                    {item.fiscalYear}
                  </Text>
                  <Text style={styles.cell}>{formatNumber(operatingCF[idx])}</Text>
                  <Text style={styles.cell}>{formatNumber(investingCF[idx])}</Text>
                  <Text style={styles.cell}>{formatNumber(financingCF[idx])}</Text>
                  <Text style={styles.cell}>{formatNumber(freeCF[idx])}</Text>
                  <Text style={styles.cell}>{formatNumber(netIncome[idx])}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** --- Legend Item Component --- */
const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffbf5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#123530",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#12353009",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#123530",
  },
  chartStyle: { marginVertical: 8, borderRadius: 8 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd" },
  headerRow: {
    backgroundColor: "#12353011",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  cell: {
    fontSize: 11,
    color: "#000",
    minWidth: 100,
    textAlign: "right",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  headerCell: { fontWeight: "700", textAlign: "center" },
  labelCell: { textAlign: "center", fontWeight: "600", color: "#444" },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 6,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 12, color: "#333" },
});
