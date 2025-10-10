import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { getAllIndexQuotes, getStockList, getCryptoList, getForexList } from '@/services/_fmpApi';

type Tab = 'Indices' | 'Stocks' | 'Crypto' | 'Forex';

/** Custom debounce hook */
function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function AllMarketScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Indices');
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const debouncedSearch = useDebounce(searchText, 300);

  const normalizeData = (items: any[], type: Tab) => {
    return items.map(item => ({
      symbol: item.symbol || item.ticker || '',
      price: item.price || item.close || 0,
      change: item.change || item.changesPercentage || 0,
      name: item.name || item.companyName || '',
      exchange: item.exchange || '',
      type
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let fetched: any[] = [];

      if (activeTab === 'Indices') {
        const indices = await getAllIndexQuotes();
        fetched = normalizeData(indices, 'Indices');
      } else if (activeTab === 'Stocks') {
        const stocks = await getStockList();
        fetched = normalizeData(stocks, 'Stocks');
      } else if (activeTab === 'Crypto') {
        const crypto = await getCryptoList();
        fetched = normalizeData(crypto, 'Crypto');
      } else if (activeTab === 'Forex') {
        const forex = await getForexList();
        fetched = normalizeData(forex, 'Forex');
      }

      setData(fetched);
      setFilteredData(fetched);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  /** Debounced search effect */
  useEffect(() => {
    if (!debouncedSearch) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item =>
      (item.symbol + item.name).toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    setFilteredData(filtered);
  }, [debouncedSearch, data]);

  const renderItem = (item: any) => {
    const trend = item.change >= 0;
    return (
      <TouchableOpacity key={item.symbol} style={styles.itemButton}>
        <View style={styles.itemRow}>
          <Text style={styles.symbolText}>{item.symbol}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.priceText, { color: trend ? 'green' : 'red' }]}>
              {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.changeText, { color: trend ? 'green' : 'red' }]}>
              {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder={`Search ${activeTab}...`}
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['Indices', 'Stocks', 'Crypto', 'Forex'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#123530" />
        ) : filteredData.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No {activeTab} found.</Text>
        ) : (
          filteredData.map(renderItem)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffbf5',
    paddingTop: 38,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
    color: '#666',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#123530',
  },
  activeTabText: {
    color: '#123530',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  itemButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1235301A',
    marginBottom: 4,
    borderRadius: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  symbolText: {
    fontWeight: '600',
    color: '#123530',
  },
  priceText: {
    fontWeight: '600',
  },
  changeText: {
    fontSize: 12,
  },
});
