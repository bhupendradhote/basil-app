import axios from 'axios';

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';
const FMP_API_KEY = 'pNfPaAqCCLW5TIyeNfmbJ9CaocjvSfNb'; // 🔑 Your API key

// Axios instance for FMP
const fmpApi = axios.create({
  baseURL: FMP_BASE_URL,
  timeout: 10000,
});

// Fetch latest news
export const getLatestNews = async (page: number = 0, limit: number = 20) => {
  try {
    const response = await fmpApi.get(
      `/news/general-latest?page=${page}&limit=${limit}&apikey=${FMP_API_KEY}`
    );
    return response.data;
  } catch (error: any) {
    console.error('FMP News API error:', error.message);
    throw error;
  }
};

// Fetch historical EOD prices for index (daily)
export const getHistoricalEOD = async (symbol: string) => {
  try {
    const response = await fmpApi.get(
      `/historical-price-eod/full?symbol=${symbol}&apikey=${FMP_API_KEY}`
    );
    return response.data.historical || response.data;
  } catch (error: any) {
    console.error('FMP Historical EOD API error:', error.message);
    throw error;
  }
};

// Fetch intraday chart (5min / 1hour)
export const getIntradayChart = async (symbol: string, interval: '5min' | '1hour') => {
  try {
    const response = await fmpApi.get(
      `/historical-chart/${interval}?symbol=${symbol}&apikey=${FMP_API_KEY}`
    );
    return response.data;
  } catch (error: any) {
    console.error('FMP Intraday Chart API error:', error.message);
    throw error;
  }
};

// ✅ Fetch all stocks list (symbol + companyName)
export const getStockList = async () => {
  try {
    const response = await fmpApi.get(
      `/stock-list?apikey=${FMP_API_KEY}`
    );
    return response.data; // [{symbol: "CROX", companyName: "Crocs, Inc."}, ...]
  } catch (error: any) {
    console.error('FMP Stock List API error:', error.message);
    throw error;
  }
};

// Fetch quote for a specific stock (full details)
export const getQuote = async (symbol: string) => {
  if (!symbol) throw new Error("Symbol is required for getQuote");

  try {
    const response = await fmpApi.get(`/quote?symbol=${symbol}&apikey=${FMP_API_KEY}`);
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error(`No quote data found for symbol ${symbol}`);
    }
    return response.data[0]; // return single stock object
  } catch (error: any) {
    console.error('FMP Quote API error:', error.message);
    throw error;
  }
};


// Fetch company profile
export const getCompanyProfile = async (symbol: string) => {
  try {
    const response = await fmpApi.get(`/profile?symbol=${symbol}&apikey=${FMP_API_KEY}`);
    return response.data;
  } catch (error: any) {
    console.error('FMP Company Profile API error:', error.message);
    throw error;
  }
};


// Fetch dividends
export const getDividends = async (symbol: string) => {
  try {
    const res = await fmpApi.get(
      `/dividends?symbol=${symbol}&apikey=${FMP_API_KEY}`
    );
    return res.data; // returns array
  } catch (err: any) {
    console.error('FMP Dividends API error:', err.message);
    return [];
  }
};

// Fetch splits
export const getSplits = async (symbol: string) => {
  try {
    const res = await fmpApi.get(
      `/splits?symbol=${symbol}&apikey=${FMP_API_KEY}`
    );
    return res.data; // returns array
  } catch (err: any) {
    console.error('FMP Splits API error:', err.message);
    return [];
  }
};

// 🔑 Fetch key metrics
export const getKeyMetrics = async (symbol: string) => {
  try {
    const res = await fmpApi.get(
      `/key-metrics?symbol=${symbol}&apikey=${FMP_API_KEY}`
    );
    return res.data; // returns array of key metrics
  } catch (err: any) {
    console.error('FMP Key Metrics API error:', err.message);
    return [];
  }
};

export const fetchCashFlowStatement = async (symbol: string) => {
  try {
    const response = await axios.get(`${FMP_BASE_URL}/cash-flow-statement`, {
      params: { symbol, apikey: FMP_API_KEY },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.error("Cash Flow API error:", err);
    return [];
  }
};

export const fetchIncomeStatement = async (symbol: string) => {
  try {
    const response = await axios.get(`${FMP_BASE_URL}/income-statement`, {
      params: { symbol, apikey: FMP_API_KEY },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.error("Income Statement API error:", err);
    return [];
  }
};

export const getIncomeStatement = async (symbol: string) => {
  try {
    const res = await axios.get(`${FMP_BASE_URL}/income-statement`, {
      params: { symbol, apikey: FMP_API_KEY, limit: 10 },
    });
    return res.data;
  } catch (err) {
    console.error("Income Statement API error:", err);
    return [];
  }
};

export const getBalanceSheet = async (symbol: string) => {
  try {
    const res = await axios.get(`${FMP_BASE_URL}/balance-sheet-statement`, {
      params: { symbol, apikey: FMP_API_KEY, limit: 10 },
    });
    return res.data;
  } catch (err) {
    console.error("Balance Sheet API error:", err);
    return [];
  }
};


// IPO Calendar
export async function getUpcomingIPOs(limit: number = 30) {
  try {
    const { data } = await fmpApi.get(`/ipos-calendar?apikey=${FMP_API_KEY}&limit=${limit}`);
    if (Array.isArray(data)) return data;
    if (data?.ipoCalendar) return data.ipoCalendar;
    return [];
  } catch (error: any) {
    console.error("Error fetching IPO data:", error?.message || error);
    return [];
  }
}

// Economic Calendar
export async function getEconomicCalendar(limit: number = 30) {
  try {
    const { data } = await fmpApi.get(`/economic-calendar?apikey=${FMP_API_KEY}&limit=${limit}`);
    if (Array.isArray(data)) return data;
    if (data?.economicCalendar) return data.economicCalendar;
    return [];
  } catch (error: any) {
    console.error("Error fetching Economic Calendar:", error?.message || error);
    return [];
  }
}

// Earnings Calendar
export async function getEarningsCalendar(limit: number = 30) {
  try {
    const { data } = await fmpApi.get(`/earnings-calendar?apikey=${FMP_API_KEY}&limit=${limit}`);
    if (Array.isArray(data)) return data;
    if (data?.earningsCalendar) return data.earningsCalendar;
    return [];
  } catch (error: any) {
    console.error("Error fetching Earnings Calendar:", error?.message || error);
    return [];
  }
}

// Splits Calendar
export const getSplitsCalendar = async (limit: number = 50) => {
  try {
    const res = await axios.get(`${FMP_BASE_URL}/splits-calendar?apikey=${FMP_API_KEY}&limit=${limit}`);
    if (Array.isArray(res.data)) return res.data;
    return [];
  } catch (error: any) {
    console.error("Error fetching splits calendar:", error?.message || error);
    return [];
  }
};

// Dividends Calendar
export const getDividendsCalendar = async (limit: number = 50) => {
  try {
    const res = await axios.get(`${FMP_BASE_URL}/dividends-calendar?apikey=${FMP_API_KEY}&limit=${limit}`);
    if (Array.isArray(res.data)) return res.data;
    return [];
  } catch (error: any) {
    console.error("Error fetching dividends calendar:", error?.message || error);
    return [];
  }
};


export default fmpApi;
