import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { getBiggestGainers, getBiggestLosers } from '@/services/_fmpApi'; // ✅ Import both APIs

type TabType = 'gainers' | 'losers' | 'high52' | 'low52';

export default function ViewAllMarketMovers() {
  const [selectedTab, setSelectedTab] = useState<TabType>('gainers');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const staticData = {
    high52: [
      { symbol: 'DEF', name: 'DEF Corp', exchange: 'NYSE', price: 50, change: 0.5, changePercent: 1 },
      { symbol: 'HIJ', name: 'HIJ Inc.', exchange: 'NASDAQ', price: 75, change: 1.2, changePercent: 1.62 },
    ],
    low52: [
      { symbol: 'LMN', name: 'LMN Ltd.', exchange: 'NYSE', price: 1, change: 0.1, changePercent: 10 },
      { symbol: 'OPQ', name: 'OPQ Inc.', exchange: 'NASDAQ', price: 0.5, change: 0.05, changePercent: 11 },
    ],
  };

  // ✅ Fetch Top Gainers
  const fetchGainers = async () => {
    try {
      setLoading(true);
      const data = await getBiggestGainers();
      if (Array.isArray(data)) {
        const mapped = data.slice(0, 10).map((item: any) => ({
          symbol: item.symbol,
          name: item.name || item.symbol,
          exchange: item.exchange || 'N/A',
          price: parseFloat(item.price) || 0,
          change: parseFloat(item.change) || 0,
          changePercent: parseFloat(item.changesPercentage) || 0,
        }));
        setGainers(mapped);
        if (mapped.length > 0) setSelectedSymbol(mapped[0].symbol);
      }
    } catch (err) {
      console.error('Error loading gainers:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Top Losers
  const fetchLosers = async () => {
    try {
      setLoading(true);
      const data = await getBiggestLosers();
      if (Array.isArray(data)) {
        const mapped = data.slice(0, 10).map((item: any) => ({
          symbol: item.symbol,
          name: item.name || item.symbol,
          exchange: item.exchange || 'N/A',
          price: parseFloat(item.price) || 0,
          change: parseFloat(item.change) || 0,
          changePercent: parseFloat(item.changesPercentage) || 0,
        }));
        setLosers(mapped);
      }
    } catch (err) {
      console.error('Error loading losers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGainers();
    fetchLosers();
  }, []);

  // ✅ Choose which list to show
  const currentList =
    selectedTab === 'gainers'
      ? gainers
      : selectedTab === 'losers'
      ? losers
      : staticData[selectedTab];

  return (
    <ScrollView contentContainerStyle={{ padding: 0 }}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['gainers', 'losers', 'high52', 'low52'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.tabActive]}
            onPress={() => {
              setSelectedTab(tab);
              const firstItem =
                tab === 'gainers'
                  ? gainers[0]
                  : tab === 'losers'
                  ? losers[0]
                  : staticData[tab][0];
              if (firstItem) setSelectedSymbol(firstItem.symbol);
            }}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab === 'gainers'
                ? 'Top Gainers'
                : tab === 'losers'
                ? 'Top Losers'
                : tab === 'high52'
                ? '52W High'
                : '52W Low'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#1235301A',
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: '#fffbf5',
          marginBottom:25,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#123530" style={{ padding: 16 }} />
        ) : currentList && currentList.length > 0 ? (
          currentList.map(item => {
            const trend = item.change >= 0;
            return (
              <TouchableOpacity
                key={item.symbol}
                style={[
                  styles.indexButton,
                  selectedSymbol === item.symbol && { backgroundColor: '#12353003' },
                ]}
                onPress={() => setSelectedSymbol(item.symbol)}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '100%',
                    paddingHorizontal: 10,
                  }}
                >
                  <View style={{
                    width: 170,
                  }}>
                    <Text style={{ fontWeight: '600', color: '#123530' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>{item.exchange}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '600', color: trend ? 'green' : 'red' }}>
                      $
                      {item.price.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                    <Text style={{ fontSize: 12, color: trend ? 'green' : 'red' }}>
                      {item.change >= 0 ? '+' : ''}
                      {item.change.toFixed(2)} ({item.changePercent >= 0 ? '+' : ''}
                      {item.changePercent.toFixed(2)}%)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={{ textAlign: 'center', padding: 16, color: '#999' }}>No data available</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, marginTop: 50 },
  tabButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#5EC385' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#123530' },
  tabTextActive: { color: '#fff' },
  indexButton: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1235301A',
    backgroundColor: '#12353003',
  },
});
