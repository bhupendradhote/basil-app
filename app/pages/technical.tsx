// screens/AdvancedStockAnalysisScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const AdvancedStockAnalysisScreen = () => {
  const [loading, setLoading] = useState(false);
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  
  // API Key
  const FMP_DATA_API_KEY = 'pNfPaAqCCLW5TIyeNfmbJ9CaocjvSfNb';

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    try {
      const response = await fetch('https://basilstar.com/data/nse_bse_symbols.json');
      const data = await response.json();
      
      const nseSymbols = data.filter(stock => stock.symbol.endsWith('.NS'));
      setSymbols(nseSymbols);
      
      if (nseSymbols.length > 0) {
        setSelectedSymbol(nseSymbols[0].symbol);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load stock symbols');
      console.error('Error loading symbols:', error);
    }
  };

  const analyzeStock = async (symbol) => {
    if (!symbol) return;
    
    setLoading(true);
    setAnalysisData(null);
    
    try {
      const [dailyCandles, price] = await Promise.all([
        fetchHistoricalCandles(symbol),
        fetchCurrentPrice(symbol)
      ]);

      if (dailyCandles.length === 0) {
        throw new Error("No historical daily data available.");
      }

      const processedData = await processStockData(dailyCandles, price, symbol);
      setAnalysisData(processedData);

    } catch (error) {
      Alert.alert('Analysis Error', error.message);
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalCandles = async (symbol) => {
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 1);
    const fromStr = fromDate.toISOString().split('T')[0];

    const apiUrl = `https://financialmodelingprep.com/api/v3/historical-chart/1day/${symbol}?from=${fromStr}&to=${toDate}&apikey=${FMP_DATA_API_KEY}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No daily data found for ${symbol}.`);
    }

    return data.reverse().map((item, index) => ({
      time: item.date.split(' ')[0],
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      index: index
    })).filter(item => !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close));
  };

  const fetchCurrentPrice = async (symbol) => {
    const apiUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_DATA_API_KEY}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0 || !data[0].price) {
      console.warn(`Could not fetch current price for ${symbol}`);
      return null;
    }

    return parseFloat(data[0].price);
  };

  const calculateSMA = (data, period = 10) => {
    const sma = [];
    if (data.length < period) return { data: [], signals: [] };
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
      sma.push({ time: data[i].time, value: sum / period });
    }
    return { data: sma, signals: detectSMASignals(data, sma, period) };
  };

  const detectSMASignals = (data, smaData, smaPeriod = 10) => {
    const signals = [];
    for (let i = 1; i < smaData.length; i++) {
      const priceIndex = i + smaPeriod - 1;
      const prevPriceIndex = i + smaPeriod - 2;
      if (!data[priceIndex] || !data[prevPriceIndex]) continue;

      if (data[prevPriceIndex].close < smaData[i-1].value && data[priceIndex].close > smaData[i].value) {
        signals.push({ time: data[priceIndex].time, type: 'Buy', price: data[priceIndex].close });
      } else if (data[prevPriceIndex].close > smaData[i-1].value && data[priceIndex].close < smaData[i].value) {
        signals.push({ time: data[priceIndex].time, type: 'Sell', price: data[priceIndex].close });
      }
    }
    return signals;
  };

  const findSwingHighLows = (data, lookback = 5) => {
    const swingHighs = [];
    const swingLows = [];

    for (let i = lookback; i < data.length - lookback; i++) {
      let isHigh = true;
      for (let j = 1; j <= lookback; j++) {
        if (data[i - j].high > data[i].high || data[i + j].high > data[i].high) {
          isHigh = false;
          break;
        }
      }
      if (isHigh) {
        swingHighs.push({ price: data[i].high, time: data[i].time, index: i });
      }

      let isLow = true;
      for (let j = 1; j <= lookback; j++) {
        if (data[i - j].low < data[i].low || data[i + j].low < data[i].low) {
          isLow = false;
          break;
        }
      }
      if (isLow) {
        swingLows.push({ price: data[i].low, time: data[i].time, index: i });
      }
    }
    return {
      latestHigh: swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : null,
      latestLow: swingLows.length > 0 ? swingLows[swingLows.length - 1] : null,
      allHighs: swingHighs,
      allLows: swingLows
    };
  };

  const getFibs = (_top, _bot, _dir) => {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const fibValues = {};
    const rng = Math.abs(_top - _bot);

    levels.forEach(level => {
      let value;
      if (_dir === 1) {
        value = _bot + (rng * level);
      } else {
        value = _top - (rng * level);
      }
      fibValues[level.toFixed(3)] = value;
    });
    return fibValues;
  };

  const calculateMarketStructure = (data) => {
    const structureLen = 5;
    const swingPoints = findSwingHighLows(data, structureLen);
    const allHighs = swingPoints.allHighs;
    const allLows = swingPoints.allLows;

    if (allHighs.length < 1 || allLows.length < 1) {
      return null;
    }

    const lastHigh = allHighs[allHighs.length - 1];
    const lastLow = allLows[allLows.length - 1];

    if (!lastHigh || !lastLow) return null;

    let structureTop, structureBottom, dir;

    if (lastHigh.time > lastLow.time) {
      dir = 1;
      structureBottom = lastLow.price;
      structureTop = lastHigh.price;
    } else {
      dir = -1;
      structureTop = lastHigh.price;
      structureBottom = lastLow.price;
    }

    if (structureTop < structureBottom) {
      [structureTop, structureBottom] = [structureBottom, structureTop];
      dir = dir * -1;
    }

    const startIndex = Math.min(lastHigh.index, lastLow.index);
    const endIndex = data.length - 1;

    const fibLevels = getFibs(structureTop, structureBottom, dir);
    const fib0_5 = fibLevels["0.500"];
    const currentClose = data[data.length - 1].close;
    const breakout = currentClose > fib0_5 ? 'above 0.5' : 'below 0.5';

    return {
      type: dir === 1 ? 'bullish' : 'bearish',
      time: data[data.length - 1].time,
      top: structureTop,
      bottom: structureBottom,
      fib0_5_level: fib0_5,
      breakout: breakout,
      allLevels: fibLevels,
      startIndex: startIndex,
      endIndex: endIndex
    };
  };

  const calculateOverallFibonacciRetracement = (data) => {
    if (data.length === 0) return null;
    let highestHigh = -Infinity, lowestLow = Infinity;
    let highestHighTime = null, lowestLowTime = null;

    data.forEach(item => {
      if (item.high > highestHigh) {
        highestHigh = item.high;
        highestHighTime = item.time;
      }
      if (item.low < lowestLow) {
        lowestLow = item.low;
        lowestLowTime = item.time;
      }
    });

    if (highestHigh === -Infinity || lowestLow === Infinity) return null;

    const diff = highestHigh - lowestLow;
    const fib0_5 = highestHigh - (diff * 0.5);

    return {
      highestHigh: highestHigh,
      highestHighTime: highestHighTime,
      lowestLow: lowestLow,
      lowestLowTime: lowestLowTime,
      fib0_5_level: fib0_5,
      levels: {
        "1.000": highestHigh,
        "0.786": highestHigh - (diff * 0.786),
        "0.618": highestHigh - (diff * 0.618),
        "0.500": fib0_5,
        "0.382": highestHigh - (diff * 0.382),
        "0.236": highestHigh - (diff * 0.236),
        "0.000": lowestLow
      }
    };
  };

  const generateTradeAnalysisReport = (candles, price, marketStructure, overallFib) => {
    if (!candles || candles.length === 0 || price === null || !marketStructure || !overallFib) {
      return {
        recommendation: "Insufficient data for a definitive analysis based on requested criteria.",
        type: 'neutral',
        reasons: [],
        targets: [],
        stopLoss: null,
        stopLossReason: ""
      };
    }

    const currentClose = candles[candles.length - 1].close;
    const msFib0_5 = marketStructure.fib0_5_level;
    const tolerance = 0.01;

    let trendDescription = "";
    let triggerLevelText = "";
    let recommendation = "";
    let tradeType = 'neutral';
    let reasons = [];
    let targets = [];
    let stopLoss = null;
    let stopLossReason = "";

    if (currentClose > msFib0_5 && (currentClose - msFib0_5) > (msFib0_5 * tolerance)) {
      tradeType = 'buy';
      trendDescription = "Strong Bullish";
      triggerLevelText = `Buy Trigger Level: ₹${msFib0_5.toFixed(2)}`;
      stopLoss = marketStructure.bottom.toFixed(2);
      stopLossReason = `Place stop loss at ₹${marketStructure.bottom.toFixed(2)}. If price drops below this level after entry, the bullish market structure may be invalidated.`;

      let tempTargets = [];
      for (const levelKey in overallFib.levels) {
        const levelValue = overallFib.levels[levelKey];
        if (levelValue > currentClose) {
          tempTargets.push({ value: levelValue, label: `Overall Fib ${levelKey}` });
        }
      }
      tempTargets.sort((a, b) => a.value - b.value);
      targets = tempTargets.map((t, index) => `T${index + 1}: ₹${t.value.toFixed(2)}`);

    } else if (currentClose < msFib0_5 && (msFib0_5 - currentClose) > (msFib0_5 * tolerance)) {
      tradeType = 'sell';
      trendDescription = "Strong Bearish";
      triggerLevelText = `Sell Trigger Level: ₹${msFib0_5.toFixed(2)}`;
      stopLoss = marketStructure.top.toFixed(2);
      stopLossReason = `Place stop loss at ₹${marketStructure.top.toFixed(2)}. If price rises above this level after entry, the bearish market structure may be invalidated.`;

      let tempTargets = [];
      for (const levelKey in overallFib.levels) {
        const levelValue = overallFib.levels[levelKey];
        if (levelValue < currentClose) {
          tempTargets.push({ value: levelValue, label: `Overall Fib ${levelKey}` });
        }
      }
      tempTargets.sort((a, b) => b.value - a.value);
      targets = tempTargets.map((t, index) => `T${index + 1}: ₹${t.value.toFixed(2)}`);

    } else {
      tradeType = 'neutral';
      trendDescription = "Neutral / Consolidating";
      triggerLevelText = `Key Level: ₹${msFib0_5.toFixed(2)} (Market Structure Midpoint)`;
      recommendation = `The stock is consolidating around a key level. Wait for a clear breakout above or breakdown below ₹${msFib0_5.toFixed(2)} before making a move.`;
    }

    let mainRecommendationText = "";
    if (tradeType === 'buy') {
      mainRecommendationText = "A strong buy signal has been triggered. The price has moved above key resistance.";
    } else if (tradeType === 'sell') {
      mainRecommendationText = "A strong sell signal has been triggered. The price has dropped below key support.";
    } else {
      mainRecommendationText = recommendation;
    }

    let formattedRecommendation = `Trend: ${trendDescription}\n`;
    formattedRecommendation += `Current Price: ₹${price.toFixed(2)}\n`;
    formattedRecommendation += `${triggerLevelText}\n`;
    if (stopLoss) {
      formattedRecommendation += `Stop Loss: ₹${stopLoss}\n`;
    }
    formattedRecommendation += `\n${mainRecommendationText}`;

    if (targets.length > 0) {
      formattedRecommendation += `\n\n🎯 Targets:\n`;
      targets.forEach(target => {
        formattedRecommendation += `• ${target}\n`;
      });
    }

    return {
      recommendation: formattedRecommendation,
      type: tradeType,
      reasons,
      targets,
      stopLoss,
      stopLossReason
    };
  };

  const processStockData = async (candles, price, symbol) => {
    const smaData = calculateSMA(candles, 10);
    const swingPoints = findSwingHighLows(candles);
    const marketStructure = calculateMarketStructure(candles);
    const overallFib = calculateOverallFibonacciRetracement(candles);
    const tradeReport = generateTradeAnalysisReport(candles, price, marketStructure, overallFib);

    return {
      symbol,
      currentPrice: price,
      smaData,
      swingPoints,
      marketStructure,
      overallFib,
      tradeReport,
      candles
    };
  };

  const renderDetailCard = (label, value, date = '', additionalInfo = null) => (
    <View style={styles.detailCard}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueContainer}>
        {value ? <Text style={styles.detailValue}>{value}</Text> : null}
        {date ? <Text style={styles.detailDate}>{date}</Text> : null}
        {additionalInfo}
      </View>
    </View>
  );

  const renderTradeRecommendation = (report) => {
    const typeStyle = report.type === 'buy' ? styles.buyRecommendation : 
                     report.type === 'sell' ? styles.sellRecommendation : 
                     styles.neutralRecommendation;

    return (
      <View style={[styles.tradeRecommendation, typeStyle]}>
        <Text style={styles.recommendationText}>{report.recommendation}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Advanced Stock Analysis</Text>
      </View>

      {/* Stock Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Select a Stock to Analyze:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSymbol}
            onValueChange={(value) => setSelectedSymbol(value)}
            style={styles.picker}
          >
            {symbols.map((stock) => (
              <Picker.Item 
                key={stock.symbol} 
                label={`${stock.name} (${stock.symbol})`} 
                value={stock.symbol} 
              />
            ))}
          </Picker>
        </View>
        
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={() => analyzeStock(selectedSymbol)}
          disabled={loading}
        >
          <Text style={styles.analyzeButtonText}>
            {loading ? 'Analyzing...' : 'Analyze Stock'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing stock data...</Text>
        </View>
      )}

      {/* Analysis Results */}
      {analysisData && (
        <View style={styles.analysisSection}>


          {/* Trade Recommendation */}
          <Text style={styles.sectionTitle}>Trade Recommendation & Strategy</Text>
          {renderTradeRecommendation(analysisData.tradeReport)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffbf5',
    padding: 16,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#123530',
    textAlign: 'center',
  },
  selectorContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  picker: {
    height: 50,
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  analysisSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  detailGrid: {
    gap: 12,
  },
  detailCard: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    flex: 1,
  },
  detailValueContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'right',
  },
  detailDate: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'right',
  },
  msDetails: {
    alignItems: 'flex-end',
  },
  msType: {
    fontSize: 12,
    color: '#4a5568',
  },
  msRange: {
    fontSize: 12,
    color: '#4a5568',
    marginTop: 2,
  },
  msFibValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
    marginTop: 4,
  },
  bullishText: {
    color: '#16a34a',
    fontWeight: '700',
  },
  bearishText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  tradeRecommendation: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  buyRecommendation: {
    backgroundColor: '#e6ffe6',
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  sellRecommendation: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 2,
  },
  neutralRecommendation: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default AdvancedStockAnalysisScreen;