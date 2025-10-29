import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

type TabType = "gainers" | "losers" | "high52" | "low52";

export default function MarketMovers() {
  const [selectedTab, setSelectedTab] = useState<TabType>("gainers");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // FMP key (keep secure in production)
  const FMP_API_KEY = "pNfPaAqCCLW5TIyeNfmbJ9CaocjvSfNb";

  const staticData = {
    high52: [
      { symbol: "DEF", name: "DEF Corp", exchange: "NSE", price: 50, change: 0.5, changePercent: 1 },
      { symbol: "HIJ", name: "HIJ Inc.", exchange: "NSE", price: 75, change: 1.2, changePercent: 1.62 },
    ],
    low52: [
      { symbol: "LMN", name: "LMN Ltd.", exchange: "NSE", price: 1, change: 0.1, changePercent: 10 },
      { symbol: "OPQ", name: "OPQ Inc.", exchange: "NSE", price: 0.5, change: 0.05, changePercent: 11 },
    ],
  };

  // helper: chunk array
  const chunkArray = (arr: string[], size: number) => {
    const chunks: string[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const fetchAllNSEQuotes = async () => {
    try {
      setLoading(true);

      // 1) Load symbol list
      const res = await fetch("https://basilstar.com/data/nse_bse_symbols.json");
      const allStocks = await res.json();
      if (!Array.isArray(allStocks)) throw new Error("Invalid symbol list");

      // 2) Keep only .NS symbols
      const nseSymbols = allStocks
        .filter((s: any) => typeof s.symbol === "string" && s.symbol.endsWith(".NS"))
        .map((s: any) => s.symbol);

      if (nseSymbols.length === 0) {
        setGainers([]);
        setLosers([]);
        setSelectedSymbol(null);
        return;
      }

      // 3) Chunk (FMP allows many symbols; be conservative)
      const chunkSize = 100;
      const chunks = chunkArray(nseSymbols, chunkSize);

      // 4) Fetch all chunks in parallel
      const allResponses = await Promise.all(
        chunks.map(async (chunk) => {
          const symbolsStr = chunk.join(",");
          const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(
            symbolsStr
          )}?apikey=${FMP_API_KEY}`;
          try {
            const r = await fetch(url);
            const data = await r.json();
            return Array.isArray(data) ? data : [];
          } catch (err) {
            console.warn("chunk fetch failed", err);
            return [];
          }
        })
      );

      // 5) Flatten & sanitize
      const flat = allResponses.flat();

      const mapped = flat
        .filter((d: any) => {
          // require numeric price & previousClose and previousClose not zero
          return (
            d &&
            (d.price !== undefined && d.previousClose !== undefined) &&
            !isNaN(Number(d.price)) &&
            !isNaN(Number(d.previousClose)) &&
            Number(d.previousClose) !== 0
          );
        })
        .map((d: any) => {
          const price = Number(d.price);
          const prev = Number(d.previousClose);
          const change = price - prev;
          const changePercent = Number(((change / prev) * 100).toFixed(2));
          return {
            symbol: d.symbol,
            name: d.name || d.symbol,
            exchange: "NSE",
            price,
            change,
            changePercent,
          };
        });

      // 6) Build gainers (top +) and losers (most negative)
      const gainersSorted = [...mapped]
        .filter((x) => x.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 10);

      const losersSorted = [...mapped]
        .filter((x) => x.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent) // ascending (most negative first)
        .slice(0, 10);

      setGainers(gainersSorted);
      setLosers(losersSorted);

      // set default selected symbol
      const first =
        gainersSorted.length > 0 ? gainersSorted[0] : losersSorted.length > 0 ? losersSorted[0] : null;
      setSelectedSymbol(first ? first.symbol : null);
    } catch (err) {
      console.error("Error fetching NSE quotes", err);
      setGainers([]);
      setLosers([]);
      setSelectedSymbol(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNSEQuotes();
    // optionally poll every X seconds: uncomment below (careful with API limits)
    // const iv = setInterval(fetchAllNSEQuotes, 60_000);
    // return () => clearInterval(iv);
  }, []);

  // pick list to display based on tab
  const currentList = useMemo(() => {
    if (selectedTab === "gainers") return gainers;
    if (selectedTab === "losers") return losers;
    return staticData[selectedTab];
  }, [selectedTab, gainers, losers]);

  return (
    <ScrollView contentContainerStyle={{ padding: 0 }}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["gainers", "losers", "high52", "low52"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.tabActive]}
            onPress={() => {
              setSelectedTab(tab);
              // set default selected symbol for that tab
              const firstItem =
                tab === "gainers" ? gainers[0] : tab === "losers" ? losers[0] : staticData[tab][0];
              if (firstItem) setSelectedSymbol(firstItem.symbol);
            }}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab === "gainers" ? "Top Gainers" : tab === "losers" ? "Top Losers" : tab === "high52" ? "52W High" : "52W Low"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <View style={styles.containerCard}>
        {loading ? (
          <ActivityIndicator size="small" color="#123530" style={{ padding: 0 }} />
        ) : currentList && currentList.length > 0 ? (
          currentList.map((item) => {
            const trend = item.change >= 0;
            return (
              <TouchableOpacity
                key={item.symbol}
                style={[
                  styles.indexButton,
                  selectedSymbol === item.symbol && { backgroundColor: "#12353008" },
                ]}
                onPress={() => setSelectedSymbol(item.symbol)}
              >
                <View style={styles.row}>
                  <View style={{ width: 170 }}>
                    <Text style={{ fontWeight: "600", color: "#123530" }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>{item.exchange} • {item.symbol}</Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontWeight: "700", color: trend ? "green" : "red" }}>
                      ₹{Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={{ fontSize: 12, color: trend ? "green" : "red" }}>
                      {item.change >= 0 ? "+" : ""}
                      {item.change.toFixed(2)} ({item.changePercent >= 0 ? "+" : ""}
                      {item.changePercent.toFixed(2)}%)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={{ textAlign: "center", padding: 16, color: "#999" }}>No data available</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#f0f0f0" },
  tabActive: { backgroundColor: "#5EC385" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#123530" },
  tabTextActive: { color: "#fff" },
  containerCard: {
    borderWidth: 1,
    borderColor: "#1235301A",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fffbf5",
    marginBottom: 25,
  },
  indexButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1235301A",
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 6 },
});
