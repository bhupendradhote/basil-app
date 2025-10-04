// WatchlistScreen.tsx
import React, { useEffect, useState } from "react";
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
import { getStockList, getQuote } from "@/services/_fmpApi"; // Import stock quote API

const WatchlistScreen = () => {
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [editWatchlistId, setEditWatchlistId] = useState<number | null>(null);

  // Stock add modal
  const [stockModalVisible, setStockModalVisible] = useState(false);

  // Long press state
  const [longPressedId, setLongPressedId] = useState<number | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  // Load stocks for a watchlist with real data
  const loadStocks = async (watchlistId: number) => {
    try {
      setStockLoading(true);
      const symbols = await getWatchlistStocks(watchlistId);

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

  // Load FMP stock list
  const loadAllStocks = async () => {
    try {
      const data = await getStockList();
      setAllStocks(data.slice(0, 100)); // Limit to first 100 for performance
    } catch (err) {
      console.error("Error loading stock list", err);
      setAllStocks([]);
    }
  };

  useEffect(() => {
    loadWatchlists();
    loadAllStocks();
  }, []);

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
      loadWatchlists();
    } catch (err) {
      console.error("Save Watchlist Error:", err);
      Alert.alert("Error", "Failed to save watchlist");
    }
  };

  const handleEditWatchlist = (watchlist: any) => {
    setNewWatchlistName(watchlist.name);
    setEditWatchlistId(watchlist.id);
    setModalVisible(true);
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
            loadWatchlists();
          } catch (err) {
            console.error("Delete Watchlist Error:", err);
            Alert.alert("Error", "Failed to delete watchlist");
          }
        },
      },
    ]);
  };

  // Add stock to watchlist
  const handleAddStockToWatchlist = async (stock: any) => {
    if (!activeTab) {
      Alert.alert("Select a watchlist first");
      return;
    }
    try {
      await addStockToWatchlist(activeTab, stock.symbol);
      Alert.alert("Added", `${stock.symbol} added to watchlist`);
      setStockModalVisible(false);
      loadStocks(activeTab); // Refresh the stocks list
    } catch (err) {
      console.error("Error adding stock to watchlist", err);
      Alert.alert("Error", "Failed to add stock");
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
            loadStocks(activeTab); // Refresh the stocks list
          } catch (err) {
            console.error("Error removing stock from watchlist", err);
            Alert.alert("Error", "Failed to remove stock");
          }
        },
      },
    ]);
  };

  const renderStock = ({ item }: any) => {
    const isPositive = item.changesPercentage >= 0;
    const changeColor = isPositive ? "green" : "red";
    const changeSign = isPositive ? "+" : "";

    return (
      <TouchableOpacity
        style={styles.stockRow}
        onLongPress={() => handleRemoveStock(item.symbol)}
      >
        <View style={styles.circle} />
        <View style={{ flex: 1 }}>
          <Text style={styles.stockName}>{item.symbol}</Text>
          <Text style={styles.exchange}>{item.name}</Text>
        </View>
        <View style={{ marginLeft: 12, alignItems: 'flex-end' }}>
          <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
          <Text style={[styles.change, { color: changeColor }]}>
            {changeSign}{item.change?.toFixed(2)} ({changeSign}{item.changesPercentage?.toFixed(2)}%)
          </Text>
        </View>
        <TouchableOpacity
          style={{ marginLeft: 10 }}
          onPress={() => handleRemoveStock(item.symbol)}
        >
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFMPStock = ({ item }: any) => (
    <TouchableOpacity
      style={styles.fmpStockRow}
      onPress={() => handleAddStockToWatchlist(item)}
    >
      <Text style={{ fontWeight: "600", width: 80 }}>{item.symbol}</Text>
      <Text style={{ color: "gray", flex: 1 }} numberOfLines={1}>
        {item.companyName}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="green" />
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
        {/* ADD WATCHLIST BUTTON - FIXED POSITION */}
        <TouchableOpacity
          style={styles.addWatchlistButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={30} color="green" />
        </TouchableOpacity>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollViewContent}>
          {watchlists.map((tab) => (
            <View key={tab.id} style={styles.tabWrapper}>
              <TouchableOpacity
                onPress={() => handleTabPress(tab)}
                onLongPress={() => handleTabLongPress(tab.id)}
                style={styles.tab}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id && styles.activeTabText,
                  ]}
                >
                  {tab.name}
                </Text>
                {activeTab === tab.id && <View style={styles.activeLine} />}
              </TouchableOpacity>

              {/* Show Edit/Delete only on long press */}
              {longPressedId === tab.id && (
                <View style={styles.tabActions}>
                  <TouchableOpacity onPress={() => handleEditWatchlist(tab)}>
                    <Ionicons name="create-outline" size={18} color="blue" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteWatchlist(tab.id)}
                    style={{ marginLeft: 6 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="red" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Stocks List */}
      {stockLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="green" />
        </View>
      ) : (
        <FlatList
          data={stocks}
          renderItem={renderStock}
          keyExtractor={(item) => item.symbol}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stocks in this watchlist</Text>
              <Text style={styles.emptySubText}>
                Tap the + button to add stocks
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* Create/Edit Watchlist Modal (Unchanged) */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              {editWatchlistId ? "Edit Watchlist" : "Create Watchlist"}
            </Text>
            <TextInput
              placeholder="Enter watchlist name"
              value={newWatchlistName}
              onChangeText={setNewWatchlistName}
              style={styles.input}
            />
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity style={styles.modalBtn} onPress={handleSaveWatchlist}>
                <Text style={{ color: "#fff" }}>{editWatchlistId ? "Save" : "Create"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "gray", marginLeft: 10 }]}
                onPress={() => {
                  setModalVisible(false);
                  setEditWatchlistId(null);
                  setNewWatchlistName("");
                }}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stock Add Modal (Unchanged) */}
      <Modal visible={stockModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '80%', width: '90%' }]}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              Add Stock to Watchlist
            </Text>
            <FlatList
              data={allStocks}
              renderItem={renderFMPStock}
              keyExtractor={(item) => item.symbol}
              contentContainerStyle={{ paddingBottom: 20 }}
              style={{ maxHeight: '80%' }}
            />
            <TouchableOpacity
              style={[styles.modalBtn, { marginTop: 10 }]}
              onPress={() => setStockModalVisible(false)}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add New Stock Button (Floating) */}
      <TouchableOpacity style={styles.AddNewButton} onPress={() => setStockModalVisible(true)}>
        <Ionicons name="add" size={30} color="green" />
      </TouchableOpacity>

    </SafeAreaView>
  );
};

export default WatchlistScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },

  // New container to hold the title and the "Add Watchlist" button
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16, // Adjusted padding
    paddingBottom: 5,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#123530" },

  // New style for the "Add Watchlist" button
  addWatchlistButton: {
    padding: 5,
  },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 16
  },
  tabsScrollViewContent: {
    alignItems: 'flex-start', // Ensure tabs start from the left
  },
  tabWrapper: {
    alignItems: "center",
    marginRight: 20,
  },
  tab: {
    alignItems: "center",
    paddingVertical: 10,
  },
  tabText: { fontSize: 14, color: "gray" },
  activeTabText: { color: "black", fontWeight: "bold" },
  activeLine: { height: 2, backgroundColor: "green", marginTop: 4, width: "100%" },
  tabActions: { flexDirection: "row", marginTop: 4, position: 'absolute', top: 5, right: -40, zIndex: 10 },

  stockRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderColor: "#ddd" },
  fmpStockRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 0.5, borderColor: "#eee", paddingHorizontal: 8 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eee", marginRight: 12 },
  stockName: { fontWeight: "600", fontSize: 14 },
  exchange: { fontSize: 12, color: "gray" },
  price: { fontWeight: "600", fontSize: 14 },
  change: { fontSize: 12 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "80%" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 10, marginTop: 10 },
  modalBtn: { flex: 1, backgroundColor: "green", padding: 10, borderRadius: 6, alignItems: "center" },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: 'gray', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: 'lightgray' },
  AddNewButton: { position: 'absolute', bottom: 100, right: 20, padding: 5, borderWidth: 1, borderColor: 'black', borderRadius: 50 }
});

