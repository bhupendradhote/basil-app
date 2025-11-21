import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function NSEStocksView() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const [loading, setLoading] = useState(false);

  // const FMP_API_KEY = "pNfPaAqCCLW5TIyeNfmbJ9CaocjvSfNb";
const FMP_API_KEY = '84y12ovhukWyiW2v1MjL4bxx8TXskGOb';


  const fetchNSEStocks = async () => {
    try {
      setLoading(true);

      // 1️⃣ Load all symbols
      const res = await fetch("https://basilstar.com/data/nse_bse_symbols.json");
      const allStocks = await res.json();
      if (!Array.isArray(allStocks)) throw new Error("Invalid symbol list");

      // 2️⃣ Filter NSE symbols
      const nseSymbols = allStocks
        .filter((s: any) => s.symbol.endsWith(".NS"))
        .map((s: any) => s.symbol);

      // 3️⃣ Chunk symbols
      const chunkSize = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < nseSymbols.length; i += chunkSize) {
        chunks.push(nseSymbols.slice(i, i + chunkSize));
      }

      // 4️⃣ Fetch all chunks in parallel
      const allData = await Promise.all(
        chunks.map(async (chunk) => {
          const symbolsStr = chunk.join(",");
          const resp = await fetch(
            `https://financialmodelingprep.com/api/v3/quote/${symbolsStr}?apikey=${FMP_API_KEY}`
          );
          const data = await resp.json();
          return Array.isArray(data) ? data : [];
        })
      );

      // 5️⃣ Flatten and calculate change & changePercent
      const allResults = allData
        .flat()
        .filter((d: any) => d.price && d.previousClose) // remove invalid
        .map((d: any) => {
          const price = parseFloat(d.price);
          const prev = parseFloat(d.previousClose);
          const change = price - prev;
          const changePercent = parseFloat(((change / prev) * 100).toFixed(2));
          return {
            symbol: d.symbol,
            name: d.name || d.symbol,
            price,
            change,
            changePercent,
          };
        });

      setStocks(allResults);
    } catch (error) {
      console.error("Error fetching NSE data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNSEStocks();
  }, []);

  // 6️⃣ Sort gainers/losers
  const displayedStocks = React.useMemo(() => {
    if (tab === "gainers") {
      return stocks
        .filter((s) => s.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 100);
    } else {
      return stocks
        .filter((s) => s.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent) // ascending for biggest losers
        .slice(0, 100);
    }
  }, [stocks, tab]);

  return (
    <ScrollView contentContainerStyle={{ padding: 0 }}>
      <View style={styles.header}>
        <Text style={styles.title}>NSE Stocks (Top Gainers & Losers)</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "gainers" && styles.activeTab]}
          onPress={() => setTab("gainers")}
        >
          <Text
            style={[styles.tabText, tab === "gainers" && styles.activeTabText]}
          >
            Top Gainers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "losers" && styles.activeTab]}
          onPress={() => setTab("losers")}
        >
          <Text
            style={[styles.tabText, tab === "losers" && styles.activeTabText]}
          >
            Top Losers
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#123530" style={{ padding: 20 }} />
        ) : displayedStocks.length > 0 ? (
          displayedStocks.map((item) => {
            const trend = item.change >= 0;
            return (
              <View key={item.symbol} style={styles.stockItem}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: "#123530" }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#777" }}>{item.symbol}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{ fontWeight: "700", color: trend ? "green" : "red" }}
                  >
                    ₹
                    {item.price.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text style={{ fontSize: 12, color: trend ? "green" : "red" }}>
                    {item.change >= 0 ? "+" : ""}
                    {item.change.toFixed(2)} ({item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(2)}%)
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noData}>No stock data available</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 50, marginBottom: 10, alignItems: "center" },
  title: { fontSize: 16, fontWeight: "700", color: "#123530" },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },
  tabButton: { paddingVertical: 10, paddingHorizontal: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#123530" },
  tabText: { fontSize: 14, color: "#666" },
  activeTabText: { color: "#123530", fontWeight: "700" },
  listContainer: {
    borderWidth: 1,
    borderColor: "#1235301A",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fffbf5",
    marginBottom: 25,
  },
  stockItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1235301A",
  },
  noData: { textAlign: "center", padding: 16, color: "#999" },
});
