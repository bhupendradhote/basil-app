// WatchlistScreen.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, {
  getWatchlists,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
  addStockToWatchlist,
  removeStockFromWatchlist,
  getWatchlistStocks,
} from "@/services/_api";
import { getQuote } from "@/services/_fmpApi";

const WatchlistScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [editWatchlistId, setEditWatchlistId] = useState<number | null>(null);

  // Stock add modal
  const [stockModalVisible, setStockModalVisible] = useState(false);

  // Long press state
  const [longPressedId, setLongPressedId] = useState<number | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");


  const handleStockPress = (symbol: string) => {
  // Navigate to FundamentalScreen and pass symbol as param
  router.push({
    pathname: '/pages/fundamental/fundamental', // adjust path if needed
    params: { symbol },
  });
};

  // Load watchlists
  const loadWatchlists = async () => {
    try {
      setLoading(true);
      const data = await getWatchlists();
      setWatchlists(data);
      if (data.length > 0) {
        setActiveTab(data[0].id);
        loadStocks(data[0].id);
      } else {
        setStocks([]);
        setActiveTab(null);
      }
    } catch (err) {
      console.error("Error loading watchlists", err);
      Alert.alert("Error", "Failed to load watchlists");
    } finally {
      setLoading(false);
    }
  };

  // Load stocks for a watchlist with real data
  const loadStocks = async (watchlistId: number) => {
    try {
      setStockLoading(true);
      const symbols = await getWatchlistStocks(watchlistId);

      if (symbols.length === 0) {
        setStocks([]);
        return;
      }

      // Fetch current prices for all symbols in the watchlist
      const stockData = await Promise.all(
        symbols.map(async (symbol: string) => {
          try {
            const quote = await getQuote(symbol);
            return {
              symbol,
              name: quote.companyName || symbol,
              price: quote.price || 0,
              change: quote.change || 0,
              changesPercentage: quote.changesPercentage || 0,
            };
          } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            return {
              symbol,
              name: symbol,
              price: 0,
              change: 0,
              changesPercentage: 0,
            };
          }
        })
      );

      setStocks(stockData);
    } catch (err) {
      console.error("Error loading stocks", err);
      setStocks([]);
    } finally {
      setStockLoading(false);
    }
  };

  // Load stock list from JSON
  const loadAllStocks = async () => {
    try {
      const response = await fetch("https://basilstar.com/data/nse_bse_symbols.json");
      if (!response.ok) {
        throw new Error("Failed to fetch stock list");
      }
      const data = await response.json();
      setAllStocks(
        data.map((item: any) => ({
          symbol: item.symbol,
          companyName: item.name,
        }))
      );
      console.log(`Loaded ${data.length} stocks`);
    } catch (err) {
      console.error("Error loading stock list", err);
      setAllStocks([]);
    }
  };

  useEffect(() => {
    loadWatchlists();
    loadAllStocks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWatchlists();
    if (activeTab) {
      await loadStocks(activeTab);
    }
    setRefreshing(false);
  };

  const handleTabPress = (watchlist: any) => {
    setActiveTab(watchlist.id);
    loadStocks(watchlist.id);
    setLongPressedId(null);
  };

  const handleTabLongPress = (watchlistId: number) => {
    setLongPressedId((prev) => (prev === watchlistId ? null : watchlistId));
  };

  // Create or Edit Watchlist
  const handleSaveWatchlist = async () => {
    if (!newWatchlistName.trim()) {
      Alert.alert("Error", "Please enter a watchlist name.");
      return;
    }
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) throw new Error("User not logged in");
      const parsedUser = JSON.parse(userData);

      if (editWatchlistId) {
        await updateWatchlist(editWatchlistId, { name: newWatchlistName });
      } else {
        await createWatchlist({ name: newWatchlistName, user_id: parsedUser.id });
      }

      setModalVisible(false);
      setNewWatchlistName("");
      setEditWatchlistId(null);
      await loadWatchlists();
    } catch (err: any) {
      console.error("Save Watchlist Error:", err);
      Alert.alert("Error", err.message || "Failed to save watchlist");
    }
  };

  const handleEditWatchlist = (watchlist: any) => {
    setNewWatchlistName(watchlist.name);
    setEditWatchlistId(watchlist.id);
    setModalVisible(true);
    setLongPressedId(null);
  };

  const handleDeleteWatchlist = (watchlistId: number) => {
    Alert.alert("Delete Watchlist", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteWatchlist(watchlistId);
            await loadWatchlists();
          } catch (err: any) {
            console.error("Delete Watchlist Error:", err);
            Alert.alert("Error", err.message || "Failed to delete watchlist");
          }
        },
      },
    ]);
  };

  // Add stock to watchlist - FIXED
  const handleAddStockToWatchlist = async (stock: any) => {
    if (!activeTab) {
      Alert.alert("Error", "Please select a watchlist first");
      return;
    }
    try {
      await addStockToWatchlist(activeTab, stock.symbol);
      Alert.alert("Success", `${stock.symbol} added to watchlist`);
      setStockModalVisible(false);
      setSearchQuery("");
      await loadStocks(activeTab); // Refresh the stocks list
    } catch (err: any) {
      console.error("Error adding stock to watchlist", err);
      Alert.alert("Error", err.message || "Failed to add stock");
    }
  };

  // Remove stock from watchlist
  const handleRemoveStock = (symbol: string) => {
    if (!activeTab) return;

    Alert.alert("Remove Stock", `Remove ${symbol} from watchlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeStockFromWatchlist(activeTab, symbol);
            await loadStocks(activeTab); // Refresh the stocks list
          } catch (err: any) {
            console.error("Error removing stock from watchlist", err);
            Alert.alert("Error", err.message || "Failed to remove stock");
          }
        },
      },
    ]);
  };

  // Filter stocks based on search query
  const filteredStocks = allStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStock = ({ item }: any) => {
    const isPositive = item.changesPercentage >= 0;
    const changeColor = isPositive ? "#4CAF50" : "#F44336";
    const changeSign = isPositive ? "+" : "";

    return (
      <TouchableOpacity
        style={styles.stockRow}
        onPress={() => handleStockPress(item.symbol)}
        onLongPress={() => handleRemoveStock(item.symbol)}
        delayLongPress={800}
      >
        <View style={styles.circle}>
          <Text style={styles.circleText}>{item.symbol.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stockName}>{item.symbol}</Text>
          <Text style={styles.exchange} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={{ marginLeft: 12, alignItems: "flex-end" }}>
          <Text style={styles.price}>
            ₹{item.price?.toFixed(2) || "0.00"}
          </Text>
          <Text style={[styles.change, { color: changeColor }]}>
            {changeSign}{item.change?.toFixed(2) || "0.00"} ({changeSign}{item.changesPercentage?.toFixed(2) || "0.00"}%)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFMPStock = ({ item }: any) => (
    <TouchableOpacity style={styles.fmpStockRow} onPress={() => handleAddStockToWatchlist(item)}>
      <View style={styles.stockSymbolContainer}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
      </View>
      <Text style={styles.stockCompany} numberOfLines={1}>
        {item.companyName}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Watchlists...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialCommunityIcons name="view-dashboard" size={28} color="#123530" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications" size={28} color="#123530" />
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>My Watchlist</Text>
        <TouchableOpacity
          style={styles.addWatchlistButton}
          onPress={() => {
            setEditWatchlistId(null);
            setNewWatchlistName("");
            setModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={30} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollViewContent}
        >
          {watchlists.map((tab) => (
            <View key={tab.id} style={styles.tabWrapper}>
              <TouchableOpacity
                onPress={() => handleTabPress(tab)}
                onLongPress={() => handleTabLongPress(tab.id)}
                style={styles.tab}
                delayLongPress={800}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id && styles.activeTabText,
                  ]}
                  numberOfLines={1}
                >
                  {tab.name}
                </Text>
                {activeTab === tab.id && <View style={styles.activeLine} />}
              </TouchableOpacity>

              {/* Show Edit/Delete only on long press */}
              {longPressedId === tab.id && (
                <View style={styles.tabActions}>
                  <TouchableOpacity
                    onPress={() => handleEditWatchlist(tab)}
                    style={styles.tabActionButton}
                  >
                    <Ionicons name="create-outline" size={18} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteWatchlist(tab.id)}
                    style={[styles.tabActionButton, { marginLeft: 8 }]}
                  >
                    <Ionicons name="trash-outline" size={18} color="#F44336" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Stocks List */}
      <FlatList
        data={stocks}
        renderItem={renderStock}
        keyExtractor={(item) => item.symbol}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No stocks in this watchlist</Text>
            <Text style={styles.emptySubText}>Tap the + button below to add stocks</Text>
          </View>
        }
        ListHeaderComponent={
          stockLoading ? (
            <View style={styles.stockLoader}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.stockLoadingText}>Updating prices...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.stocksList,
          stocks.length === 0 && styles.emptyStocksList,
        ]}
      />

      {/* Create/Edit Watchlist Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editWatchlistId ? "Edit Watchlist" : "Create Watchlist"}
            </Text>
            <TextInput
              placeholder="Enter watchlist name"
              value={newWatchlistName}
              onChangeText={setNewWatchlistName}
              style={styles.input}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setModalVisible(false);
                  setEditWatchlistId(null);
                  setNewWatchlistName("");
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSaveWatchlist}>
                <Text style={styles.saveBtnText}>{editWatchlistId ? "Save" : "Create"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stock Add Modal */}
      <Modal visible={stockModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.stockModalContent]}>
            <Text style={styles.modalTitle}>Add Stock to Watchlist</Text>

            <TextInput
              placeholder="Search stocks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />

            <FlatList
              data={filteredStocks}
              renderItem={renderFMPStock}
              keyExtractor={(item) => item.symbol}
              style={styles.stocksFlatList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.searchEmptyContainer}>
                  <Text style={styles.searchEmptyText}>
                    {searchQuery ? "No stocks found" : "Loading stocks..."}
                  </Text>
                </View>
              }
            />

            <TouchableOpacity
              style={[styles.modalBtn, styles.closeBtn]}
              onPress={() => {
                setStockModalVisible(false);
                setSearchQuery("");
              }}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add New Stock Button (Floating) */}
      {watchlists.length > 0 && activeTab && (
        <TouchableOpacity style={styles.addNewButton} onPress={() => setStockModalVisible(true)}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default WatchlistScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#123530",
  },
  addWatchlistButton: {
    padding: 5,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 4,
    marginTop: 12,
  },
  tabsScrollViewContent: {
    alignItems: "flex-start",
    paddingRight: 16,
  },
  tabWrapper: {
    alignItems: "center",
    marginRight: 16,
  },
  tab: {
    alignItems: "center",
    paddingVertical: 2,
  },
  tabText: {
    fontSize: 15,
    color: "#666666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#123530",
    fontWeight: "bold",
  },
  activeLine: {
    height: 3,
    backgroundColor: "#4CAF50",
    marginTop: 6,
    width: "100%",
    borderRadius: 2,
  },
  tabActions: {
    flexDirection: "row",
    position: "absolute",
    top: 8,
    right: -40,
    backgroundColor: "#FFFFFF",
    padding: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabActionButton: {
    padding: 4,
  },
  stocksList: {
    flexGrow: 1,
  },
  emptyStocksList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
  },
  stockName: {
    fontWeight: "600",
    fontSize: 14,
    color: "#123530",
  },
  exchange: {
    fontSize: 11,
    color: "#666666",
    marginTop: 2,
  },
  price: {
    fontWeight: "600",
    fontSize: 14,
    color: "#123530",
  },
  change: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
  },
  stockModalContent: {
    maxHeight: "80%",
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#123530",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
  },
  closeBtn: {
    backgroundColor: "#666666",
    marginTop: 12,
  },
  cancelBtnText: {
    color: "#666666",
    fontWeight: "600",
    fontSize: 16,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  fmpStockRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    alignItems: "center",
  },
  stockSymbolContainer: {
    width: 80,
  },
  stockSymbol: {
    fontWeight: "600",
    fontSize: 15,
    color: "#123530",
  },
  stockCompany: {
    color: "#666666",
    flex: 1,
    fontSize: 14,
  },
  stocksFlatList: {
    maxHeight: 400,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 8,
    marginTop: 16,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
  searchEmptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  searchEmptyText: {
    fontSize: 16,
    color: "#666666",
  },
  addNewButton: {
    position: "absolute",
    bottom: '16%',
    right: 20,
    backgroundColor: "#4CAF50",
    width: 45,
    height: 45,
    borderRadius: 30, 
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stockLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#F9F9F9",
  },
  stockLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666666",
  },
});
