import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <- same storage your api.ts uses

const { width } = Dimensions.get("window");

export default function Screen2() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        // Use the same key as _api.ts
        const token = await AsyncStorage.getItem("token");
        if (token) {
          // User is logged in, redirect to dashboard
          router.replace("/(tabs)");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.log("Error checking login:", error);
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A4035" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoBox}>
        <Ionicons name="leaf-outline" size={36} color="#0A4035" />
        <Text style={styles.logoText}>BasilStar</Text>
      </View>

      {/* Image Section */}
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri: "https://www.shutterstock.com/shutterstock/photos/2083443211/display_1500/stock-photo-portrait-of-attractive-cheerful-amazed-girl-using-device-gadget-app-smm-post-isolated-over-bright-2083443211.jpg",
          }}
          style={styles.mainImage}
        />

        {/* Floating tags with BlurView */}
        <BlurView
          intensity={50}
          tint="light"
          style={[styles.tagBox, { top: -25, right: -10 }]}
        >
          <Text style={styles.tagText}>
            Reliance hit <Text style={styles.link}>₹1240</Text>
          </Text>
          <Text style={styles.subTag}>
            AI confirms Target {"\n"}1 reached
          </Text>
        </BlurView>

        <BlurView
          intensity={50}
          tint="light"
          style={[styles.tagBox, { bottom: -25, left: -18 }]}
        >
          <Text style={styles.tagText}>Reliance Industries</Text>
          <Text style={[styles.subTag, { color: "#00A65A" }]}>
            +2.5% Strong Buy
          </Text>
        </BlurView>
      </View>

      {/* Welcome Box */}
      <View style={styles.welcomeBox}>
        <Text style={styles.welcomeTitle}>Welcome to Basil Star</Text>
        <Text style={styles.welcomeSubtitle}>
          Your AI-powered partner for {"\n"} smart investing.
        </Text>
      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(auth)/AuthScreen")}
      >
        <Text style={styles.buttonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF7",
    paddingHorizontal: 20,
    paddingTop: 110,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAF7",
  },
  logoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 50,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#123530",
    marginLeft: 8,
  },
  imageWrapper: {
    width: width * 0.75,
    height: width * 0.85,
    backgroundColor: "#fff",
    marginBottom: 50,
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    zIndex: 0,
    position: "relative",
    borderRadius: 20,
  },
  tagBox: {
    position: "absolute",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    zIndex: 2,
    overflow: "hidden",
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#111",
  },
  subTag: {
    fontSize: 10,
    fontWeight: "500",
    color: "#666",
  },
  link: {
    color: "#5EC385",
    fontWeight: "700",
  },
  welcomeBox: {
    alignItems: "center",
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0A4035",
    marginBottom: 11,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#1235309a",
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A4035",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 13,
    width: width * 0.8,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
});
