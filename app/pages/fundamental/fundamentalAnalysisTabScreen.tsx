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
import { SafeAreaView } from 'react-native-safe-area-context';
import { getIncomeStatement, getBalanceSheet } from "@/services/_fmpApi";
import { BarChart, LineChart } from "react-native-chart-kit";

type FundamentalAnalysisTabScreenProps = {
  symbol: string;
};

// Define colors for consistency
const CHART_COLORS = {
  revenue: "#007AFF", // Blue
  grossProfit: "#28A745", // Green
  netIncome: "#FF3B30", // Red
  operatingIncome: "#007AFF", // Blue
  ebitda: "#28A745", // Green
  totalAssets: "#007AFF", // Blue
  totalLiabilities: "#FF3B30", // Red
  equity: "#28A745", // Green
};

// Helper component for the chart legend
const ChartLegend = ({ legendItems }: { legendItems: { name: string; color: string }[] }) => (
  <View style={styles.legendContainer}>
    {legendItems.map((item) => (
      <View key={item.name} style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
        <Text style={styles.legendText}>{item.name}</Text>
      </View>
    ))}
  </View>
);

export default function FundamentalAnalysisTabScreen({ symbol }: FundamentalAnalysisTabScreenProps) {
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Sort data by date descending to show most recent first in tables, 
      // but reverse for charts to show oldest first (left to right trend)
      const income = (await getIncomeStatement(symbol)).reverse();
      const balance = (await getBalanceSheet(symbol)).reverse();

      setIncomeData(income);
      setBalanceData(balance);
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

  const screenWidth = Dimensions.get("window").width - 32; // Adjusted for better padding

  const formatCurrency = (val: number | undefined) =>
    val !== undefined ? `$${(val / 1e9).toFixed(2)}B` : "-";

  // Data for the Bar Chart Legend
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

        {/* Income Statement Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Statement (Last 5 Years)</Text>
          {/* Note: Reversing back for table display if necessary, otherwise use as is from state */}
          <ScrollView horizontal>
            <View>
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.headerCell]}>Date</Text>
                {incomeData.slice().reverse().map((item) => ( // Reverse for table to show most recent first
                  <Text key={item.date} style={[styles.cell, styles.headerCell]}>
                    {item.fiscalYear}
                  </Text>
                ))}
              </View>
              {[
                "revenue",
                "grossProfit",
                "operatingIncome",
                "ebitda",
                "netIncome",
                "eps",
              ].map((field) => (
                <View style={styles.row} key={field}>
                  <Text style={[styles.cell, styles.labelCell]}>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                  {incomeData.slice().reverse().map((item) => ( // Reverse for table
                    <Text key={item.date + field} style={styles.cell}>
                      {field === "eps"
                        ? item[field] !== undefined ? item[field].toFixed(2) : "-"
                        : formatCurrency(item[field])}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Combined Chart (Revenue, Gross Profit, Net Income) */}
          <Text style={styles.chartTitle}>Combined Chart (Revenue, Gross Profit, Net Income)</Text>
          <ChartLegend legendItems={incomeBarLegend} />
          <BarChart
            data={{
              labels: incomeData.map((i) => i.fiscalYear),
              datasets: [
                { data: incomeData.map((i) => i.revenue / 1e9 || 0), color: () => CHART_COLORS.revenue },
                { data: incomeData.map((i) => i.grossProfit / 1e9 || 0), color: () => CHART_COLORS.grossProfit },
                { data: incomeData.map((i) => i.netIncome / 1e9 || 0), color: () => CHART_COLORS.netIncome },
              ],
              // Removed 'legend' property to fix the error
            }}
            width={screenWidth}
            height={250} // Increased height for better visibility
            yAxisLabel="$"
            yAxisSuffix="B" // Added suffix to y-axis for clarity
            showValuesOnTopOfBars={false} // Clean up bars
            chartConfig={{
              backgroundGradientFrom: "#f0f0f0", // Light gray background for better contrast
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 1, // Use 1 decimal place on chart
              color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              labelColor: () => "#333",
              barPercentage: 0.8, // Make bars slightly wider
              propsForLabels: { // Added text-anchor for better label placement
                textAnchor: 'middle'
              },
            }}
            style={styles.chartStyle}
          />

          {/* Operating Income and EBITDA Line Chart */}
          <Text style={styles.chartTitle}>Operating Income & EBITDA Trend</Text>
          <LineChart
            data={{
              labels: incomeData.map((i) => i.fiscalYear),
              datasets: [
                { data: incomeData.map((i) => i.operatingIncome / 1e9 || 0), color: () => CHART_COLORS.operatingIncome },
                { data: incomeData.map((i) => i.ebitda / 1e9 || 0), color: () => CHART_COLORS.ebitda },
              ],
              legend: ["Operating Income", "EBITDA"], // Legend is allowed here for LineChart
            }}
            width={screenWidth}
            height={250} // Increased height
            yAxisLabel="$"
            yAxisSuffix="B" // Added suffix
            chartConfig={{
              backgroundGradientFrom: "#f0f0f0",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              labelColor: () => "#333",
              propsForDots: { r: "4" }, // Make dots slightly bigger
            }}
            bezier
            style={styles.chartStyle}
          />
        </View>

        {/* Balance Sheet Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Sheet (Last 5 Years)</Text>
          <ScrollView horizontal>
            <View>
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.headerCell]}>Date</Text>
                {balanceData.slice().reverse().map((item) => ( // Reverse for table
                  <Text key={item.date} style={[styles.cell, styles.headerCell]}>
                    {item.fiscalYear}
                  </Text>
                ))}
              </View>
              {[
                "totalAssets",
                "totalCurrentAssets",
                "totalNonCurrentAssets",
                "totalLiabilities",
                "totalCurrentLiabilities",
                "totalNonCurrentLiabilities",
                "totalStockholdersEquity",
                "cashAndCashEquivalents",
              ].map((field) => (
                <View style={styles.row} key={field}>
                  <Text style={[styles.cell, styles.labelCell]}>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                  {balanceData.slice().reverse().map((item) => ( // Reverse for table
                    <Text key={item.date + field} style={styles.cell}>
                      {formatCurrency(item[field])}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Balance Sheet Bar Chart */}
          <Text style={styles.chartTitle}>Balance Sheet Overview</Text>
          <ChartLegend legendItems={balanceBarLegend} />
          <BarChart
            data={{
              labels: balanceData.map((i) => i.fiscalYear),
              datasets: [
                { data: balanceData.map((i) => i.totalAssets / 1e9 || 0), color: () => CHART_COLORS.totalAssets },
                { data: balanceData.map((i) => i.totalLiabilities / 1e9 || 0), color: () => CHART_COLORS.totalLiabilities },
                { data: balanceData.map((i) => i.totalStockholdersEquity / 1e9 || 0), color: () => CHART_COLORS.equity },
              ],
              // Removed 'legend' property to fix the error
            }}
            width={screenWidth}
            height={250} // Increased height
            yAxisLabel="$"
            yAxisSuffix="B" // Added suffix
            showValuesOnTopOfBars={false} // Clean up bars
            chartConfig={{
              backgroundGradientFrom: "#f0f0f0",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              labelColor: () => "#333",
              barPercentage: 0.8,
              propsForLabels: {
                textAnchor: 'middle'
              },
            }}
            style={styles.chartStyle}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffbf5", }, // Added horizontal padding
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 20, color: "#123530" }, // Increased font size
  section: { marginBottom: 24, borderRadius: 8, }, // Added padding, background, and elevation
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16, color: "#123530" }, // Increased font size
  row: { flexDirection: "row", marginBottom: 4, alignItems: "center" }, // Reduced margin
  headerRow: { backgroundColor: "#12353011", borderBottomWidth: 1, borderBottomColor: "#ccc" }, // Lighter header background
  cell: { fontSize: 11, color: "#000", minWidth: 70, textAlign: "right", paddingVertical: 6, paddingHorizontal: 4 }, // Adjusted minWidth and padding
  headerCell: { fontWeight: "700", minWidth: 70 },
  labelCell: { textAlign: "left", fontWeight: "600", width: 120, minWidth: 120, color: "#444" }, // Increased width for labels
  chartTitle: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8, color: "#123530" }, // Increased font size
  chartStyle: { marginVertical: 8, borderRadius: 8, paddingRight: 35, }, // Adjusted style
  legendContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8, paddingHorizontal: 10 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 12, color: "#333" },
});