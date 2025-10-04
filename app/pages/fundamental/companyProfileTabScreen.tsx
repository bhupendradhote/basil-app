import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Linking, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCompanyProfile } from "@/services/_fmpApi"; // We will add this function
import Theme from "@/constants/theme";

type Props = { symbol: string };

type Profile = {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: number;
  beta: number;
  lastDividend: number;
  range: string;
  change: number;
  changePercentage: number;
  volume: number;
  averageVolume: number;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchangeFullName: string;
  exchange: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  image: string;
  ipoDate: string;
};

export default function CompanyProfileTabScreen({ symbol }: Props) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getCompanyProfile(symbol);
        if (Array.isArray(res) && res.length > 0) setProfile(res[0]);
      } catch (err) {
        console.error("Company Profile API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [symbol]);

  if (loading) return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#123530" style={{ marginTop: 50 }} /></SafeAreaView>;
  if (!profile) return <SafeAreaView style={styles.empty}><Text>No company profile available.</Text></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 0 }} showsVerticalScrollIndicator={false}>
        {/* Company Header */}
        <View style={styles.header}>
          <Image source={{ uri: profile.image }} style={styles.logo} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.companyName}>{profile.companyName}</Text>
            <Text style={styles.symbol}>{profile.symbol} | {profile.exchangeFullName}</Text>
            <Text style={styles.price}>Price: ₹{profile.price.toFixed(2)} ({profile.change.toFixed(2)} | {profile.changePercentage.toFixed(2)}%)</Text>
          </View>
        </View>

        {/* Key Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Key Information</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Industry:</Text><Text style={styles.infoValue}>{profile.industry}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Sector:</Text><Text style={styles.infoValue}>{profile.sector}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>CEO:</Text><Text style={styles.infoValue}>{profile.ceo}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Employees:</Text><Text style={styles.infoValue}>{profile.fullTimeEmployees}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Country:</Text><Text style={styles.infoValue}>{profile.country}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Exchange:</Text><Text style={styles.infoValue}>{profile.exchange}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>IPO Date:</Text><Text style={styles.infoValue}>{profile.ipoDate}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Website:</Text>
            <TouchableOpacity onPress={() => Linking.openURL(profile.website)}>
              <Text style={[styles.infoValue, { color: "#007bff" }]}>{profile.website}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Company Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>About the Company</Text>
          <Text style={styles.descriptionText}>{profile.description}</Text>
        </View>

        {/* Contact Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Contact Information</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Address:</Text><Text style={styles.infoValue}>{`${profile.address}, ${profile.city}, ${profile.state} - ${profile.zip}`}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Phone:</Text><Text style={styles.infoValue}>{profile.phone}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Currency:</Text><Text style={styles.infoValue}>{profile.currency}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Market Cap:</Text><Text style={styles.infoValue}>{(profile.marketCap / 1e9).toFixed(2)} B</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Beta:</Text><Text style={styles.infoValue}>{profile.beta}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Last Dividend:</Text><Text style={styles.infoValue}>{profile.lastDividend}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>52W Range:</Text><Text style={styles.infoValue}>{profile.range}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Average Volume:</Text><Text style={styles.infoValue}>{profile.averageVolume.toLocaleString()}</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, padding: 0, textAlign: "center", marginTop: 50 },
  header: { flexDirection: "row", marginBottom: 16, alignItems: "center" },
  logo: { width: 60, height: 60, resizeMode: "contain" },
  companyName: { fontSize: 18, fontWeight: "600" },
  symbol: { fontSize: 14, color: "#555", marginVertical: 2 },
  price: { fontSize: 14, fontWeight: "500" },
  infoContainer: { marginBottom: 20, padding: 12, borderRadius: 12, backgroundColor: "#f2f2f2" },
  infoTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  infoLabel: { fontSize: 14, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "400", flexShrink: 1, textAlign: "right" },
  descriptionContainer: { marginBottom: 20, padding: 12, borderRadius: 12, backgroundColor: "#fafafa" },
  descriptionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  descriptionText: { fontSize: 14, lineHeight: 20, textAlign: "justify" },
});
