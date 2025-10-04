import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
  Entypo,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "@/services/_api"; // axios instance

export default function UserProfile() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);

  // Load user data
  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser({
          name: parsedUser.name || "User",
          email: parsedUser.email || "Not Available",
          avatar: parsedUser.avatar || "https://i.pravatar.cc/150?img=12",
        });
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await api.post(
          "/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      await AsyncStorage.clear();
      router.replace("/(auth)/AuthScreen");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#123530" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', gap: 10 ,alignItems:'center'}}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{user.name}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => router.push("/pages/profile/PersonalInformation")}
          >
            <Ionicons name="folder-outline" size={20} color="#123530" />
            <Text style={styles.optionText}>Personal Information</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => router.push("/pages/profile/notificationandAlerts")}
          >
            <Ionicons name="notifications-outline" size={20} color="#123530" />
            <Text style={styles.optionText}>Notifications & Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => router.push("/pages/profile/settingsScreen")}
          >
            <Ionicons name="settings-outline" size={20} color="#123530" />
            <Text style={styles.optionText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, { marginTop: 8 }]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#d9534f" />
            <Text style={[styles.optionText, { color: "#d9534f" }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View>
        {/* Divider */}
        <View style={styles.divider} />

        {/* Social Icons */}
        <View style={styles.socialRow}>
          <TouchableOpacity>
            <Entypo name="instagram" size={22} color="#123530" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Entypo name="linkedin" size={22} color="#123530" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Entypo name="twitter" size={22} color="#123530" />
          </TouchableOpacity>
          <TouchableOpacity>
            <FontAwesome name="facebook-f" size={22} color="#123530" />
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF7",
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 30,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#5EC385",
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 0,
  },
  optionsContainer: {
    marginTop: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#123530",
    fontWeight: "500",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginTop: 20,
    marginBottom: 20,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
});
