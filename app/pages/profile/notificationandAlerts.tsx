import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from "expo-router";
const { width } = Dimensions.get("window");

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
};

const notifications: NotificationItem[] = [
  {
    id: "1",
    title: "Notification 1 (Name of notification)",
    message: "Notification message",
    time: "Wednesday, 8:30 pm",
  },
  {
    id: "2",
    title: "Notification 1 (Name of notification)",
    message: "Notification message",
    time: "Wednesday, 8:30 pm",
  },
  {
    id: "3",
    title: "Notification 1 (Name of notification)",
    message: "Notification message",
    time: "Wednesday, 8:30 pm",
  },
  {
    id: "4",
    title: "Notification 1 (Name of notification)",
    message: "Notification message",
    time: "Wednesday, 8:30 pm",
  },
  {
    id: "5",
    title: "Notification 1 (Name of notification)",
    message: "Notification message",
    time: "Wednesday, 8:30 pm",
  },
];

export default function NotificationAndAlertsScreen() {
  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={styles.card}>
      {/* Left image placeholder */}
      <View style={styles.imagePlaceholder} />

      {/* Texts */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', gap: '10px' }}>
          <Ionicons name="grid-outline" size={28} color="#004D40" />
          <Text style={styles.headerText}>Notification and Alerts</Text>
        </View>
        <View>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
    justifyContent: 'space-between'
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 10,
    color: "#004D40",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#D9D9D9",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: "#888",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
    marginLeft: 62, // aligns with text, not image
  },
});
