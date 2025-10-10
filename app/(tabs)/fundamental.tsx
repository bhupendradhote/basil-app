import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Theme from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Chatbot from '../component/Chatbot';

interface StockSymbol {
  symbol: string;
  name: string;
}

interface FinancialData {
  financialGrowth: any[];
  cashFlowGrowth: any[];
  balanceSheetGrowth: any[];
  incomeStatementGrowth: any[];
  ratios: any[];
  keyMetrics: any[];
}

interface AnalysisSummary {
  overallHealth: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  recommendation: string;
}

const FMP_API_KEY = 'pNfPaAqCCLW5TIyeNfmbJ9CaocjvSfNb';

export default function FundamentalScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Theme.Colors.dark : Theme.Colors.light;
  const fonts = Theme.Fonts;
  const typography = Theme.Typography;
  const textStyles = colorScheme === 'dark' ? Theme.DarkTextStyles : Theme.TextStyles;

  const [selectedPeriod, setSelectedPeriod] = useState<'Annual' | 'Quarter'>('Annual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSymbol | null>(null);
  const [symbols, setSymbols] = useState<StockSymbol[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const periods = ['Annual', 'Quarter'];

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    try {
      const response = await fetch('https://basilstar.com/data/nse_bse_symbols.json');
      const parsed = await response.json();
      const data: StockSymbol[] = Array.isArray(parsed) ? parsed : [];
      const nseSymbols: StockSymbol[] = data.filter((stock: StockSymbol) => typeof stock.symbol === 'string' && stock.symbol.endsWith('.NS'));
      setSymbols(nseSymbols);
      if (nseSymbols.length > 0) {
        setSelectedStock(nseSymbols[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load stock symbols');
      console.error('Error loading symbols:', err);
    }
  };

  const safeToLower = (v?: string) => (typeof v === 'string' ? v.toLowerCase() : '');

  const filteredSymbols = symbols.filter(
    (symbol) =>
      safeToLower(symbol.symbol).includes(safeToLower(searchQuery)) ||
      safeToLower(symbol.name).includes(safeToLower(searchQuery))
  );

  const fetchFinancialData = async (symbol: string) => {
    setLoading(true);
    setError(null);
    setFinancialData(null);
    setAnalysisSummary(null);

    try {
      const endpoints = [
        `https://financialmodelingprep.com/stable/financial-growth?symbol=${symbol}&apikey=${FMP_API_KEY}`,
        `https://financialmodelingprep.com/stable/cash-flow-statement-growth?symbol=${symbol}&apikey=${FMP_API_KEY}`,
        `https://financialmodelingprep.com/stable/balance-sheet-statement-growth?symbol=${symbol}&apikey=${FMP_API_KEY}`,
        `https://financialmodelingprep.com/stable/income-statement-growth?symbol=${symbol}&apikey=${FMP_API_KEY}`,
        `https://financialmodelingprep.com/stable/ratios?symbol=${symbol}&apikey=${FMP_API_KEY}`,
        `https://financialmodelingprep.com/stable/key-metrics?symbol=${symbol}&apikey=${FMP_API_KEY}`,
      ];

      const responses = await Promise.all(
        endpoints.map(async (url) => {
          try {
            const res = await fetch(url);
            if (!res.ok) {
              console.warn(`Non-ok response for ${url}: ${res.status}`);
              return [];
            }
            const json = await res.json();
            return Array.isArray(json) ? json : (json ? [json] : []);
          } catch (err) {
            console.warn(`Failed to fetch ${url}:`, err);
            return [];
          }
        })
      );

      const data: FinancialData = {
        financialGrowth: responses[0] || [],
        cashFlowGrowth: responses[1] || [],
        balanceSheetGrowth: responses[2] || [],
        incomeStatementGrowth: responses[3] || [],
        ratios: responses[4] || [],
        keyMetrics: responses[5] || [],
      };

      setFinancialData(data);
      const summary = generateAnalysisSummary(data);
      setAnalysisSummary(summary);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch financial data. API may not support all Indian stocks.');
      Alert.alert('Error', 'Failed to fetch financial data. API may not support all Indian stocks.');
      console.error('fetchFinancialData error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Helpers ----------
  const parseNumber = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      // remove commas and percent signs, handle parenthesis
      let s = v.replace(/,/g, '').replace('%', '').trim();
      s = s.replace(/^\((.*)\)$/, '-$1'); // (123) => -123
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  // Determine if a key should be treated/displayed as percentage
  const isPercentageKey = (key: string) => {
    const k = key.toLowerCase();
    const percentIndicators = ['growth', 'margin', 'yield', 'rate', 'percent', 'returnon', 'roe', 'roa', 'roic'];
    const absoluteBlacklist = ['currentratio', 'debttoequity', 'pe', 'pb', 'price', 'marketcap', 'enterprisevalue', 'eps', 'turnover', 'inventory', 'assets', 'liabilities'];

    if (absoluteBlacklist.some(b => k.includes(b))) return false;
    if (percentIndicators.some(p => k.includes(p))) return true;
    // fallback heuristic: very small numbers like 0 < |v| <= 5 are likely ratios (not %), but we handle formatting per value in formatValue
    return false;
  };

  const getGrowthColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return colors.text;
    return value > 0 ? Theme.Colors.light.highlight : value < -0.05 ? '#dc2626' : colors.text;
  };

  const formatGrowthValue = (value: number | null | undefined, isPercentage = true) => {
    if (value === null || value === undefined) return 'N/A';
    // If value seems like decimal fraction (0.12) and isPercentage true => show 12.00%
    // If value already looks like percent (e.g., 12) but isPercentage true, we try to detect.
    // We assume the API returns decimals for growth (0.12) in many endpoints.
    const v = Number(value);
    if (isNaN(v)) return 'N/A';

    // If value is small fraction (between -5 and 5) and isPercentage -> treat as fraction and multiply by 100
    if (isPercentage) {
      const usePercent = Math.abs(v) <= 5; // heuristic
      const result = usePercent ? (v * 100) : v;
      return `${result.toFixed(2)}%`;
    }

    // absolute value formatting
    // display with commas and 2 decimals
    return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatValue = (raw: any, key: string) => {
    const num = parseNumber(raw);
    if (num === null) {
      // if it's not numeric, return original (string)
      return typeof raw === 'string' ? raw : 'N/A';
    }

    const k = key.toLowerCase();

    // Market caps / enterprise value -> show in B
    if (k.includes('marketcap') || k.includes('enterprisevalue')) {
      const absVal = Math.abs(num);
      if (absVal >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
      if (absVal >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
      if (absVal >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
      return num.toFixed(2);
    }

    // Price-like fields
    if (k.includes('price') || k.includes('value')) {
      return `$${num.toFixed(2)}`;
    }

    // Percent-like keys
    if (isPercentageKey(key)) {
      // Some fields may already be in decimals (0.12) or percentages (12)
      const v = num;
      const usePercent = Math.abs(v) <= 5;
      const val = usePercent ? v * 100 : v;
      return `${val.toFixed(2)}%`;
    }

    // Default: if value seems like a ratio (e.g., current ratio), don't multiply
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ---------- Analysis summary ----------
  const generateAnalysisSummary = (data: FinancialData): AnalysisSummary => {
    try {
      const latestRatios = (data.ratios && data.ratios.length > 0) ? data.ratios[0] : {};
      const latestKeyMetrics = (data.keyMetrics && data.keyMetrics.length > 0) ? data.keyMetrics[0] : {};
      const latestIncome = (data.incomeStatementGrowth && data.incomeStatementGrowth.length > 0) ? data.incomeStatementGrowth[0] : {};
      const latestFinancial = (data.financialGrowth && data.financialGrowth.length > 0) ? data.financialGrowth[0] : {};

      const revenueGrowth = parseNumber(latestIncome.growthRevenue) ?? parseNumber(latestFinancial.revenueGrowth) ?? 0;
      const netIncomeGrowth = parseNumber(latestIncome.growthNetIncome) ?? 0;
      const roe = parseNumber(latestKeyMetrics.returnOnEquity) ?? 0;
      const currentRatio = parseNumber(latestRatios.currentRatio) ?? 0;
      const debtToEquity = parseNumber(latestRatios.debtToEquityRatio) ?? parseNumber(latestRatios.debtToEquity) ?? 0;
      const grossMargin = parseNumber(latestRatios.grossProfitMargin) ?? 0;

      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (revenueGrowth > 0.1) strengths.push('Strong revenue growth');
      else if (revenueGrowth < 0) weaknesses.push('Declining revenue');

      if (netIncomeGrowth > 0.05) strengths.push('Positive net income growth');
      else if (netIncomeGrowth < -0.05) weaknesses.push('Declining net income');

      if (roe > 0.15 || roe > 15) strengths.push('High return on equity');
      else if (roe < 0.05) weaknesses.push('Low return on equity');

      if (currentRatio > 1.5) strengths.push('Strong liquidity position');
      else if (currentRatio < 1) weaknesses.push('Liquidity concerns');

      if (debtToEquity < 1) strengths.push('Low debt levels');
      else if (debtToEquity > 2) weaknesses.push('High debt burden');

      if (grossMargin > 0.4 || grossMargin > 40) strengths.push('Healthy gross margins');

      const health = strengths.length > weaknesses.length ? 'Strong' : weaknesses.length > strengths.length ? 'Weak' : 'Moderate';
      const recommendation = health === 'Strong' ? 'Buy/Hold - Positive fundamentals' : health === 'Weak' ? 'Caution/Sell - Address weaknesses' : 'Hold - Monitor closely';

      return {
        overallHealth: health,
        keyStrengths: strengths,
        keyWeaknesses: weaknesses,
        recommendation,
      };
    } catch (err) {
      console.error('generateAnalysisSummary error:', err);
      return {
        overallHealth: 'Moderate',
        keyStrengths: [],
        keyWeaknesses: [],
        recommendation: 'Hold - insufficient data',
      };
    }
  };

  // ---------- Render helpers ----------
  const renderGrowthItem = (label: string, value: any, key = '', isPercentage = true) => {
    const parsed = parseNumber(value);
    const display = isPercentage ? formatGrowthValue(parsed, isPercentage) : formatValue(parsed ?? value, key);
    const color = isPercentage ? getGrowthColor(parsed ?? undefined) : colors.text;
    return (
      <View style={styles.growthItem} key={label + key}>
        <Text style={[styles.growthLabel, textStyles.paragraph]}>{label}</Text>
        <Text style={[styles.growthValue, { color }, textStyles.paragraph]}>{display}</Text>
      </View>
    );
  };

  const getPeriodFilter = () => (selectedPeriod === 'Annual' ? 'FY' : 'Q');

  const renderSection = (title: string, data: any[], keys: string[], isPercentage = true, customFormatter?: (key: string, value: any) => any) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.section} key={title}>
          <Text style={[styles.sectionTitle, textStyles.subHeading]}>{title}</Text>
          <Text style={[styles.noDataText, textStyles.caption]}>No data available</Text>
        </View>
      );
    }

    const filteredData = data.filter(item => item && item.period === getPeriodFilter());
    const latest = filteredData.length > 0 ? filteredData[0] : (data[0] || {});

    return (
      <View style={styles.section} key={title}>
        <Text style={[styles.sectionTitle, textStyles.subHeading]}>{title}</Text>
        {keys.map((key) => {
          const raw = latest[key];
          if (raw === undefined || raw === null) return null;
          const displayValue = customFormatter ? customFormatter(key, raw) : (isPercentage ? formatGrowthValue(parseNumber(raw), isPercentage) : formatValue(raw, key));
          const color = isPercentage ? getGrowthColor(parseNumber(raw) ?? undefined) : colors.text;
          return (
            <View key={key} style={styles.growthItem}>
              <Text style={[styles.growthLabel, textStyles.paragraph]}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </Text>
              <Text style={[styles.growthValue, { color }, textStyles.paragraph]}>{displayValue}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRatiosSection = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const latest = data[0] || {};
    const ratioKeys = Object.keys(latest).filter((key) => !key.toLowerCase().includes('growth') && key !== 'symbol' && key !== 'date' && key !== 'fiscalYear' && key !== 'period' && key !== 'reportedCurrency');
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, textStyles.subHeading]}>Financial Ratios</Text>
        {ratioKeys.map((key) => {
          const raw = latest[key];
          if (raw === undefined || raw === null) return null;
          const isPct = isPercentageKey(key);
          return (
            <View key={key} style={styles.growthItem}>
              <Text style={[styles.growthLabel, textStyles.paragraph]}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </Text>
              <Text style={[styles.growthValue, textStyles.paragraph]}>
                {isPct ? formatValue(raw, key) : formatValue(raw, key)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderMetricsSection = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const latest = data[0] || {};
    const metricKeys = Object.keys(latest).filter((key) => !['symbol', 'date', 'fiscalYear', 'period', 'reportedCurrency'].includes(key));
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, textStyles.subHeading]}>Key Metrics</Text>
        {metricKeys.map((key) => {
          const raw = latest[key];
          if (raw === undefined || raw === null) return null;
          return (
            <View key={key} style={styles.growthItem}>
              <Text style={[styles.growthLabel, textStyles.paragraph]}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </Text>
              <Text style={[styles.growthValue, textStyles.paragraph]}>
                {formatValue(raw, key)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAnalysisSummary = (summary: AnalysisSummary) => (
    <View style={[styles.section, styles.summarySection]}>
      <Text style={[styles.sectionTitle, textStyles.heading]}>Analysis Summary</Text>
      <Text style={[
        styles.healthText,
        {
          color: summary.overallHealth === 'Strong' ? Theme.Colors.light.highlight :
                 summary.overallHealth === 'Weak' ? '#dc2626' : colors.text
        },
        textStyles.heading
      ]}>
        Overall Financial Health: {summary.overallHealth}
      </Text>

      {summary.keyStrengths.length > 0 && (
        <View style={styles.strengthsWeaknesses}>
          <Text style={[styles.subTitle, textStyles.subHeading]}>Key Strengths:</Text>
          {summary.keyStrengths.map((strength, index) => (
            <Text key={index} style={[styles.listItem, textStyles.paragraph, { color: Theme.Colors.light.highlight }]}>• {strength}</Text>
          ))}
        </View>
      )}

      {summary.keyWeaknesses.length > 0 && (
        <View style={styles.strengthsWeaknesses}>
          <Text style={[styles.subTitle, textStyles.subHeading]}>Key Weaknesses:</Text>
          {summary.keyWeaknesses.map((weakness, index) => (
            <Text key={index} style={[styles.listItem, textStyles.paragraph, { color: '#dc2626' }]}>• {weakness}</Text>
          ))}
        </View>
      )}

      <Text style={[
        styles.recommendationText,
        textStyles.subHeading,
        {
          backgroundColor: summary.overallHealth === 'Strong' ? Theme.Colors.light.highlight :
                           summary.overallHealth === 'Weak' ? '#dc2626' : colors.tint
        }
      ]}>
        Recommendation: {summary.recommendation}
      </Text>
    </View>
  );

  const renderSymbolItem = ({ item }: { item: StockSymbol }) => (
    <TouchableOpacity
      style={styles.symbolItem}
      onPress={() => {
        setSelectedStock(item);
        setShowSearchModal(false);
        setSearchQuery('');
      }}
    >
      <Text style={[styles.symbolText, textStyles.paragraph]}>{`${item.name ?? 'Unknown'} (${item.symbol})`}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="view-dashboard" size={28} color={colors.text} style={{ marginRight: 12 }} />
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, textStyles.heading]}>Fundamental</Text>

        {/* Search Section */}
        <View style={styles.searchSection}>
          {/* Hero */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, textStyles.heading]}>Comprehensive Stock Growth Analyzer</Text>
            <Text style={[styles.heroSubtitle, textStyles.paragraph]}>Advanced analysis of Income, Balance Sheet, Cash Flow, Ratios, and Key Metrics.</Text>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: selectedPeriod === period ? Theme.Colors.light.tint : 'transparent',
                    borderColor: colors.icon,
                  },
                ]}
                onPress={() => setSelectedPeriod(period as 'Annual' | 'Quarter')}
              >
                <Text
                  style={[
                    styles.periodText,
                    textStyles.paragraph,
                    {
                      color: selectedPeriod === period ? Theme.Colors.light.background : colors.text,
                    },
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Container */}
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
            <Text style={[styles.searchPlaceholder, textStyles.paragraph]}>
              {selectedStock ? `${selectedStock.name ?? 'Unknown'} (${selectedStock.symbol})` : 'Search for a stock...'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!selectedStock || loading) && styles.disabledButton,
              { backgroundColor: Theme.Colors.light.tint }
            ]}
            onPress={() => selectedStock && fetchFinancialData(selectedStock.symbol)}
            disabled={!selectedStock || loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.Colors.light.background} />
            ) : (
              <>
                <Text style={[styles.analyzeButtonText, textStyles.subHeading, { color: Theme.Colors.light.background }]}>Analyze Fundamentals</Text>
                <MaterialIcons name="analytics" size={20} color={Theme.Colors.light.background} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, textStyles.paragraph]}>Fetching and analyzing financial data...</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={[styles.errorContainer, { backgroundColor: colorScheme === 'dark' ? '#dc2626' : '#fee2e2' }]}>
            <Text style={[styles.errorText, textStyles.paragraph]}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={[styles.retryText, textStyles.paragraph, { color: colors.tint }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {financialData && selectedStock && analysisSummary && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsTitle, textStyles.heading]}>{`${selectedStock.name ?? selectedStock.symbol} (${selectedStock.symbol}) - ${selectedPeriod} Fundamentals`}</Text>

            {renderAnalysisSummary(analysisSummary)}

            {renderSection('Revenue & Profit Growth', financialData.financialGrowth, [
              'revenueGrowth',
              'grossProfitGrowth',
              'netIncomeGrowth',
              'epsgrowth',
              'freeCashFlowGrowth',
            ])}

            {renderSection('Income Statement', financialData.incomeStatementGrowth, [
              'growthRevenue',
              'growthGrossProfit',
              'growthOperatingIncome',
              'growthEBITDA',
              'growthNetIncome',
            ])}

            {renderSection('Balance Sheet', financialData.balanceSheetGrowth, [
              'growthTotalAssets',
              'growthTotalLiabilities',
              'growthTotalStockholdersEquity',
              'growthCashAndCashEquivalents',
              'growthTotalCurrentAssets',
            ])}

            {renderSection('Cash Flow', financialData.cashFlowGrowth, [
              'growthNetCashProvidedByOperatingActivites',
              'growthOperatingCashFlow',
              'growthFreeCashFlow',
              'growthNetCashUsedForInvestingActivites',
              'growthNetCashUsedProvidedByFinancingActivities',
            ])}

            {renderRatiosSection(financialData.ratios)}

            {renderMetricsSection(financialData.keyMetrics)}
          </View>
        )}

        {/* Placeholder */}
        {!selectedStock && !loading && !error && (
          <View style={styles.placeholderSection}>
            <View style={[
              styles.placeholderCard,
              {
                backgroundColor: colorScheme === 'dark' ? Theme.Colors.dark.background : Theme.Colors.light.background
              }
            ]}>
              <MaterialCommunityIcons
                name="chart-box"
                size={64}
                color={colors.icon}
                style={styles.placeholderIcon}
              />
              <Text style={[styles.placeholderTitle, textStyles.heading]}>Select a stock to analyze fundamentals</Text>
              <Text style={[styles.placeholderSubtitle, textStyles.paragraph]}>Search above to fetch comprehensive financial data and insights</Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* AI Chatbot */}
      <View style={{ position: 'absolute', bottom: 60, right: 10 }}>
        <Chatbot />
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.icon }]}>
            <TextInput
              style={[
                styles.modalSearchInput,
                textStyles.paragraph,
                {
                  color: colors.text,
                  borderColor: colors.icon,
                  backgroundColor: colorScheme === 'dark' ? Theme.Colors.dark.background : Theme.Colors.light.background
                }
              ]}
              placeholder="Search symbols or names..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowSearchModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredSymbols.slice(0, 50)}
            keyExtractor={(item) => item.symbol}
            renderItem={renderSymbolItem}
            style={styles.modalList}
            ListEmptyComponent={
              <Text style={[styles.emptyText, textStyles.paragraph]}>No matching symbols found. Try a different search.</Text>
            }
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 6,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginHorizontal: 0,
    marginVertical: 16,
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
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  periodButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    minWidth: 100,
    marginRight: 12,
  },
  periodText: {
    textAlign: 'center',
  },
  searchSection: {
    borderColor: '#0000000D',
    backgroundColor: '#1235300D',
    padding: 14,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0000000D',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    textTransform: 'uppercase',
  },
  placeholderSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  placeholderCard: {
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
  placeholderIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  placeholderTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  retryText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsTitle: {
    marginBottom: 16,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summarySection: {
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  healthText: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  strengthsWeaknesses: {
    marginBottom: 12,
  },
  subTitle: {
    marginBottom: 4,
  },
  listItem: {
    marginBottom: 2,
  },
  recommendationText: {
    textAlign: 'center',
    padding: 12,
    color: Theme.Colors.light.background,
    borderRadius: 8,
  },
  growthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  growthLabel: {
    flex: 1,
  },
  growthValue: {
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  noDataText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modalSearchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    fontSize: 16,
  },
  closeModalButton: {
    padding: 8,
  },
  modalList: {
    flex: 1,
    padding: 16,
  },
  symbolItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  symbolText: {
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    padding: 40,
    fontStyle: 'italic',
  },
});
