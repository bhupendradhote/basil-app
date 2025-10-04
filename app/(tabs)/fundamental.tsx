import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Theme from '@/constants/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Chatbot from '../component/Chatbot';

const { width, height } = Dimensions.get('window');

export default function FundamentalScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Theme.Colors.dark : Theme.Colors.light;

  const [selectedPeriod, setSelectedPeriod] = useState('Annual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);

  const periods = ['Annual', 'Quarter'];

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header (scrollable now) */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="view-dashboard" size={28} color={colors.text} />
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Fundamental</Text>
        <View style={styles.searchSection}>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Comprehensive Stock Growth Analyzer
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.icon }]}>
              An Advanced tool analyzing Income, Balance Sheet and Cash Flow data from stock listing date onward.
            </Text>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: selectedPeriod === period ? '#123530' : 'transparent',
                    borderColor: colors.icon
                  }
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodText,
                  {
                    color: selectedPeriod === period ? '#ffffff' : colors.text
                  }
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Section */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Type to search for a stock"
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity style={styles.analyzeButton}>
            <Text style={styles.analyzeButtonText}>Analyze</Text>
            <MaterialIcons name="analytics" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Placeholder Section */}
        {!selectedStock && (
          <View style={styles.placeholderSection}>
            <View style={[styles.placeholderCard, { backgroundColor: colorScheme === 'dark' ? '#1a4330' : '#ffffff' }]}>
              <MaterialCommunityIcons
                name="chart-box"
                size={64}
                color={colors.icon}
                style={styles.placeholderIcon}
              />
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                Select a stock to view financial data
              </Text>
              <Text style={[styles.placeholderSubtitle, { color: colors.icon }]}>
                Use the search bar above to find and analyze any stock
              </Text>
            </View>
          </View>
        )}

        {/* Add bottom padding so AI button doesn't overlap content */}
        <View style={{ height: 120 }} />

        {/* AI Chat Section - fixed at bottom right */}
      </ScrollView>
        <View style={{ position: 'absolute', bottom: 60, right: 10 }} >
          <Chatbot />
        </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: 0,
    marginVertical: 16,
    color: "#123530",
    marginBottom: 26,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 19,
    fontFamily: 'Bree',
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins',
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  periodButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    minWidth: 100,
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
  },
  searchSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0000000D',
    backgroundColor: '#1235300D',
    padding: 14,
    marginBottom: 24,
    shadowRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0000000D',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#123530',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Bree',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  placeholderSection: {
    marginBottom: 24,
  },
  placeholderCard: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  placeholderIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  placeholderTitle: {
    fontSize: 18,
    fontFamily: 'Bree',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 20,
  },
  aiButton: {
    // backgroundColor: 'transparent',
    // borderWidth: 1,
    // borderColor: '#123530',
    // borderRadius: 16,
    // padding: 8,
  },
  aiInner: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  aiButtonTitle: {
    fontSize: 10,
    fontFamily: 'Bree',
    fontWeight: '600',
    color: '#123530',
    textTransform: 'lowercase',
  },
  aiIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    // backgroundColor: '#0f3d2a',
    alignItems: 'center',
    justifyContent: 'center',
  },

});
