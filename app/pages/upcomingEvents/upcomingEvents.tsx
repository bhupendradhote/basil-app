// screens/upcomingEvents.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getUpcomingIPOs,
  getEconomicCalendar,
  getEarningsCalendar,
  getSplitsCalendar,
  getDividendsCalendar,
} from "@/services/_fmpApi";

type Event = {
  date: string;
  type: string;
  title: string;
  description?: string;
  link?: string;
  action?: string;
};

export default function UpcomingEventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("IPO");
  const tabs = ["IPO", "Economic Calendar", "Earning Calendar", "Corporate Calendar"];

  // IPO
  const [ipoEvents, setIpoEvents] = useState<Event[]>([]);
  const [loadingIPO, setLoadingIPO] = useState(false);

  // Economic
  const [economicEvents, setEconomicEvents] = useState<Event[]>([]);
  const [loadingEconomic, setLoadingEconomic] = useState(false);

  // Earnings
  const [earningsEvents, setEarningsEvents] = useState<Event[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(false);

  // Corporate Actions
  const [corporateEvents, setCorporateEvents] = useState<Event[]>([]);
  const [loadingCorporate, setLoadingCorporate] = useState(false);

  // IPO action filter
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const actionTabs = ["All", "Expected", "Withdrawn", "Postponed"];

  useEffect(() => {
    if (activeTab === "IPO") fetchIPOEvents();
    if (activeTab === "Economic Calendar") fetchEconomicEvents();
    if (activeTab === "Earning Calendar") fetchEarningsEvents();
    if (activeTab === "Corporate Calendar") fetchCorporateEvents();
  }, [activeTab]);

  // Fetch IPO
  const fetchIPOEvents = async () => {
    try {
      setLoadingIPO(true);
      const data = await getUpcomingIPOs();
      const mapped = data.map((item: any) => ({
        date: item.date,
        type: "IPO",
        title: `${item.company} (${item.symbol})`,
        description: `Exchange: ${item.exchange} | Shares: ${item.shares} | Market Cap: ${item.marketCap}`,
        link: `https://www.nasdaq.com/market-activity/ipos/${item.symbol}`,
        action: item.actions || "Expected",
      }));
      setIpoEvents(mapped);
    } catch (err) {
      console.error("IPO fetch failed:", err);
    } finally {
      setLoadingIPO(false);
    }
  };

  // Fetch Economic Calendar
  const fetchEconomicEvents = async () => {
    try {
      setLoadingEconomic(true);
      const data = await getEconomicCalendar();
      const mapped = data.map((item: any) => ({
        date: item.date,
        type: "Economic Data",
        title: item.event,
        description: `Country: ${item.country} | Currency: ${item.currency} | Impact: ${item.impact}`,
      }));
      setEconomicEvents(mapped);
    } catch (err) {
      console.error("Economic Calendar fetch failed:", err);
    } finally {
      setLoadingEconomic(false);
    }
  };

  // Fetch Earnings Calendar
  const fetchEarningsEvents = async () => {
    try {
      setLoadingEarnings(true);
      const data = await getEarningsCalendar();
      const mapped = data.map((item: any) => ({
        date: item.date,
        type: "Earnings",
        title: item.symbol,
        description: `EPS Actual: ${item.epsActual ?? "N/A"} | EPS Estimated: ${item.epsEstimated ?? "N/A"
          } | Revenue Actual: ${item.revenueActual ?? "N/A"} | Revenue Estimated: ${item.revenueEstimated ?? "N/A"
          }`,
      }));
      setEarningsEvents(mapped);
    } catch (err) {
      console.error("Earnings Calendar fetch failed:", err);
    } finally {
      setLoadingEarnings(false);
    }
  };

  // Fetch Corporate Actions (Splits + Dividends)
  const fetchCorporateEvents = async () => {
    try {
      setLoadingCorporate(true);

      const splits = await getSplitsCalendar();
      const dividends = await getDividendsCalendar();

      const mappedSplits: Event[] = splits.map((item: any) => ({
        date: item.date,
        type: "Split",
        title: item.symbol,
        description: `Split Ratio: ${item.numerator}:${item.denominator}`,
      }));

      const mappedDividends: Event[] = dividends.map((item: any) => ({
        date: item.date,
        type: "Dividend",
        title: item.symbol,
        description: `Dividend: ${item.dividend} | Record Date: ${item.recordDate} | Payment Date: ${item.paymentDate}`,
      }));

      setCorporateEvents([...mappedSplits, ...mappedDividends].sort((a, b) => (a.date > b.date ? 1 : -1)));
    } catch (err) {
      console.error("Corporate Calendar fetch failed:", err);
    } finally {
      setLoadingCorporate(false);
    }
  };

  // Filter IPO by action
  const filteredIPOEvents =
    actionFilter && actionFilter !== "All"
      ? ipoEvents.filter((event) => event.action === actionFilter)
      : ipoEvents;

  // Determine events & loading state
  const events =
    activeTab === "IPO"
      ? filteredIPOEvents
      : activeTab === "Economic Calendar"
        ? economicEvents
        : activeTab === "Earning Calendar"
          ? earningsEvents
          : corporateEvents;

  const loading =
    activeTab === "IPO"
      ? loadingIPO
      : activeTab === "Economic Calendar"
        ? loadingEconomic
        : activeTab === "Earning Calendar"
          ? loadingEarnings
          : loadingCorporate;

  const openLink = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ width: 35 }} />
      </View>
      <Text style={styles.headerTitle}>Upcoming Events</Text>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrapper} contentContainerStyle={{ paddingHorizontal: 4 }}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* IPO Action Tabs */}
      {activeTab === "IPO" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionTabsWrapper} contentContainerStyle={{ paddingHorizontal: 4 }}>
          {actionTabs.map((action) => (
            <TouchableOpacity key={action} style={[styles.actionTab, actionFilter === action && styles.activeActionTab]} onPress={() => setActionFilter(action)}>
              <Text style={[styles.actionTabText, actionFilter === action && styles.activeActionTabText]}>{action}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Event List */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#123530" style={{ marginTop: 40 }} />
        ) : events.length > 0 ? (
          events.map((event, idx) => (
            <TouchableOpacity key={idx} style={styles.eventCard} onPress={() => openLink(event.link)} activeOpacity={0.8}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventDate}>{event.date}</Text>
                <Text style={styles.eventType}>{event.type}</Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
              {event.action && <Text style={styles.eventAction}>Action: {event.action}</Text>}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.loader}>
            <Text style={{ fontSize: 16, color: "#333" }}>No {activeTab} events found</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffbf5", paddingTop: 35, paddingHorizontal: 16 },
  headerContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  backButton: { backgroundColor: "#0d2622", padding: 6, borderRadius: 8, width: 35, alignItems: "center", justifyContent: "center" },
  headerTitle: { marginBottom: 8, fontSize: 22, fontWeight: "500", color: "#123530", paddingVertical: 8, textAlign: "left" },
  tabsWrapper: { marginBottom: 12, maxHeight: 38 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#f3f3f3", marginRight: 8, alignItems: "center", justifyContent: "center" },
  activeTab: { backgroundColor: "#123530" },
  tabText: { fontSize: 13, color: "#333" },
  activeTabText: { color: "#fff", fontWeight: "600" },
  actionTabsWrapper: { marginBottom: 16, maxHeight: 36 },
  actionTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#e6e6e6", marginRight: 8, alignItems: "center", justifyContent: "center" },
  activeActionTab: { backgroundColor: "#123530" },
  actionTabText: { fontSize: 12, color: "#333" },
  activeActionTabText: { color: "#fff", fontWeight: "600" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 30 },
  eventCard: { backgroundColor: "#1235300D", borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  eventHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  eventDate: { fontSize: 12, fontWeight: "600", color: "#007AFF" },
  eventType: { fontSize: 12, fontWeight: "600", color: "#28A745" },
  eventTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4, color: "#123530" },
  eventDescription: { fontSize: 13, color: "#555", marginBottom: 4 },
  eventAction: { fontSize: 12, color: "#FF4500", fontWeight: "600" },
});
