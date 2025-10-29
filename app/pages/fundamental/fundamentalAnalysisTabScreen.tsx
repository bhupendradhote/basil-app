// screens/fundamentalAnalysisTabScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getIncomeStatement, getBalanceSheet } from "@/services/_fmpApi";
import { BarChart, LineChart } from "react-native-chart-kit";

type FundamentalAnalysisTabScreenProps = {
  symbol: string;
};

// Chart color palette
const CHART_COLORS = {
  revenue: "#007AFF",
  grossProfit: "#28A745",
  netIncome: "#FF3B30",
  operatingIncome: "#FF9500",
  ebitda: "#34C759",
  totalAssets: "#007AFF",
  totalLiabilities: "#FF3B30",
  equity: "#28A745",
};

// Currency conversion: 1 USD = ₹83
const USD_TO_INR = 83;

// Helper: Convert number to ₹ crore format
const formatInCrores = (val: number | undefined) => {
  if (!val) return "-";
  const croreValue = (val * USD_TO_INR) / 1e7; // Convert to ₹ Cr
  return `₹${croreValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
};

// Legend Component
const ChartLegend = ({
  legendItems,
}: {
  legendItems: { name: string; color: string }[];
}) => (
  <View style={styles.legendContainer}>
    {legendItems.map((item) => (
      <View key={item.name} style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
        <Text style={styles.legendText}>{item.name}</Text>
      </View>
    ))}
  </View>
);

export default function FundamentalAnalysisTabScreen({
  symbol,
}: FundamentalAnalysisTabScreenProps) {
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const income = (await getIncomeStatement(symbol)).reverse();
        const balance = (await getBalanceSheet(symbol)).reverse();
        setIncomeData(income);
        setBalanceData(balance);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
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

  const screenWidth = Dimensions.get("window").width - 32;
  const chartWidth = screenWidth * 1.5; // Make charts wider for scrolling

  // Chart legends
  const incomeBarLegend = [
    { name: "Revenue", color: CHART_COLORS.revenue },
    { name: "Gross Profit", color: CHART_COLORS.grossProfit },
    { name: "Net Income", color: CHART_COLORS.netIncome },
  ];

  const balanceBarLegend = [
    { name: "Total Assets", color: CHART_COLORS.totalAssets },
    { name: "Total Liabilities", color: CHART_COLORS.totalLiabilities },
    { name: "Equity", color: CHART_COLORS.equity },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.title}>Fundamental Analysis - {symbol}</Text>

        {/* === INCOME STATEMENT === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Statement (Last 5 Years)</Text>
          <ScrollView horizontal>
            <View>
              {/* Header Row */}
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.labelCell, { fontWeight: "700" }]}>Metric</Text>
                {incomeData
                  .slice()
                  .reverse()
                  .map((item) => (
                    <Text key={item.date} style={[styles.cell, styles.headerCell]}>
                      {item.fiscalYear}
                    </Text>
                  ))}
              </View>

              {/* Data Rows */}
              {[
                "revenue",
                "grossProfit",
                "operatingIncome",
                "ebitda",
                "netIncome",
                "eps",
              ].map((field) => (
                <View style={styles.row} key={field}>
                  <Text style={[styles.cell, styles.labelCell]}>
                    {field
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </Text>
                  {incomeData
                    .slice()
                    .reverse()
                    .map((item) => (
                      <Text key={item.date + field} style={styles.cell}>
                        {field === "eps"
                          ? item[field] !== undefined
                            ? item[field].toFixed(2)
                            : "-"
                          : formatInCrores(item[field])}
                      </Text>
                    ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Income Bar Chart */}
          <Text style={styles.chartTitle}>Revenue, Gross Profit & Net Income</Text>
          <ChartLegend legendItems={incomeBarLegend} />
          <ScrollView horizontal={true} style={styles.chartScroll}>
            <BarChart
              data={{
                labels: incomeData.map((i) => i.fiscalYear),
                datasets: [
                  { data: incomeData.map((i) => (i.revenue * USD_TO_INR) / 1e7 || 0), color: () => CHART_COLORS.revenue },
                  { data: incomeData.map((i) => (i.grossProfit * USD_TO_INR) / 1e7 || 0), color: () => CHART_COLORS.grossProfit },
                  { data: incomeData.map((i) => (i.netIncome * USD_TO_INR) / 1e7 || 0), color: () => CHART_COLORS.netIncome },
                ],
              }}
              width={chartWidth}
              height={250}
              yAxisLabel="₹"
              yAxisSuffix=" Cr"
              chartConfig={{
                backgroundGradientFrom: "#f9f9f9",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: () => "#333",
                barPercentage: 0.7,
              }}
              style={styles.chartStyle}
            />
          </ScrollView>

          {/* Line Chart */}
          <Text style={styles.chartTitle}>Operating Income & EBITDA Trend</Text>
          <ScrollView horizontal={true} style={styles.chartScroll}>
            <LineChart
              data={{
                labels: incomeData.map((i) => i.fiscalYear),
                datasets: [
                  { data: incomeData.map((i) => (i.operatingIncome * USD_TO_INR) / 1e7 || 0), color: () => CHART_COLORS.operatingIncome },
                  { data: incomeData.map((i) => (i.ebitda * USD_TO_INR) / 1e7 || 0), color: () => CHART_COLORS.ebitda },
                ],
                legend: ["Operating Income (₹ Cr)", "EBITDA (₹ Cr)"],
              }}
              width={chartWidth}
              height={250}
              yAxisLabel="₹"
              yAxisSuffix=" Cr"
              chartConfig={{
                backgroundGradientFrom: "#f9f9f9",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                labelColor: () => "#333",
                propsForDots: { r: "4" },
              }}
              bezier
              style={styles.chartStyle}
            />
          </ScrollView>
        </View>

        {/* === BALANCE SHEET === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Sheet (Last 5 Years)</Text>
          <ScrollView horizontal>
            <View>
              {/* Header */}
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.labelCell, { fontWeight: "700" }]}>Metric</Text>
                {balanceData
                  .slice()
                  .reverse()
                  .map((item) => (
                    <Text key={item.date} style={[styles.cell, styles.headerCell]}>
                      {item.fiscalYear}
                    </Text>
                  ))}
              </View>

              {/* Data Rows */}
              {[
                "totalAssets",
                "totalCurrentAssets",
                "totalLiabilities",
                "totalCurrentLiabilities",
                "totalStockholdersEquity",
                "cashAndCashEquivalents",
              ].map((field) => (
                <View style={styles.row} key={field}>
                  <Text style={[styles.cell, styles.labelCell]}>
                    {field
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </Text>
                  {balanceData
                    .slice()
                    .reverse()
                    .map((item) => (
                      <Text key={item.date + field} style={styles.cell}>
                        {formatInCrores(item[field])}
                      </Text>
                    ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Balance Sheet Chart */}
          <Text style={styles.chartTitle}>Assets, Liabilities & Equity</Text>
          <ChartLegend legendItems={balanceBarLegend} />
          <ScrollView horizontal={true} style={styles.chartScroll}>
            <BarChart
              data={{
                labels: balanceData.map((i) => i.fiscalYear),
                datasets: [
                  { data: balanceData.map((i) => (i.totalAssets * USD_TO_INR) / 1e7 || 0), color: () => CHART_COLORS.totalAssets },
                  { data: balanceData.map((i) => (i.totalLiabilities * USD_TO_INR) / 1e7 || 0), color: () => CHART_COLORS.totalLiabilities },
                  { data: balanceData.map((i) => (i.totalStockholdersEquity * USD_TO_INR) / 1e7 || 0), color: () => CHART_COLORS.equity },
                ],
              }}
              width={chartWidth}
              height={250}
              yAxisLabel="₹"
              yAxisSuffix=" Cr"
              chartConfig={{
                backgroundGradientFrom: "#f9f9f9",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                labelColor: () => "#333",
                barPercentage: 0.7,
              }}
              style={styles.chartStyle}
            />
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffbf5", paddingHorizontal: 8 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 10,
    color: "#123530",
    textAlign: "center",
  },
  section: { marginBottom: 28, borderRadius: 10, paddingVertical: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#123530",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center",
  },
  headerRow: {
    backgroundColor: "#12353011",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  cell: {
    fontSize: 12,
    color: "#000",
    minWidth: 90,
    textAlign: "right",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  headerCell: { fontWeight: "700", minWidth: 90 },
  labelCell: {
    textAlign: "left",
    fontWeight: "600",
    width: 150,
    minWidth: 150,
    color: "#333",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
    color: "#123530",
  },
  chartScroll: { marginVertical: 8, borderRadius: 8 }, // Style for ScrollView wrapper
  chartStyle: { paddingRight: 35 }, // Adjusted to remove marginVertical for scroll
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 12, color: "#333" },
});
