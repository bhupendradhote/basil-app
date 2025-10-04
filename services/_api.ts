// app/services/_api.ts (unchanged, as it's now connecting successfully to https://basilstar.com/api)

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keep as is, since it's working with the public URL
const API_URL = 'https://basilstar.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for detailed error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Detailed API Error:', {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response ? error.response.data : null,
    });
    return Promise.reject(error);
  }
);

// app/services/_api.ts (getAllLearnings)

export const getAllLearnings = async () => {
  try {
    const response = await api.get('/learning');
    // Assuming the API response has a "data" field
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to fetch learnings:', error.response?.data || error.message);
    throw error;
  }
};

export const getMarketPredictions = async () => {
  try {
    const response = await api.get('/market-predictions');
    console.log('Market Predictions API Response:', response.data);
    return response.data.data; // make sure API returns { data: [...] }
  } catch (error: any) {
    console.error('Failed to fetch market predictions:', error.response?.data || error.message);
    throw error;
  }
};


// ---------------------- Watchlist APIs ----------------------

// 1️⃣ Get all watchlists
export const getWatchlists = async () => {
  try {
    const response = await api.get('/watchlists');
    console.log('Watchlists API Response:', response.data);
    return response.data.watchlists || [];
  } catch (error: any) {
    console.error('Failed to fetch watchlists:', error.response?.data || error.message);
    return [];
  }
};

// 2️⃣ Create a new watchlist
export const createWatchlist = async (data: { name: string; user_id: number }) => {
  try {
    const response = await api.post('/watchlists', data);
    console.log('Watchlist Created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create watchlist:', error.response?.data || error.message);
    throw error;
  }
};

// 3️⃣ Update a watchlist
export const updateWatchlist = async (id: number, data: { name?: string }) => {
  try {
    const response = await api.put(`/watchlists/${id}`, data);
    console.log('Watchlist Updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to update watchlist:', error.response?.data || error.message);
    throw error;
  }
};

// 4️⃣ Delete a watchlist
export const deleteWatchlist = async (id: number) => {
  try {
    const response = await api.delete(`/watchlists/${id}`);
    console.log('Watchlist Deleted:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to delete watchlist:', error.response?.data || error.message);
    throw error;
  }
};

// 5️⃣ Add stock to watchlist
export const addStockToWatchlist = async (watchlistId: number, symbol: string) => {
  try {
    const response = await api.post(`/watchlists/${watchlistId}/items`, { symbol });
    console.log('Stock added to watchlist:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to add stock to watchlist:', error.response?.data || error.message);
    throw error;
  }
};

// 6️⃣ Remove stock from watchlist
export const removeStockFromWatchlist = async (watchlistId: number, symbol: string) => {
  try {
    const response = await api.delete(`/watchlists/${watchlistId}/items/${symbol}`);
    console.log('Stock removed from watchlist:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to remove stock from watchlist:', error.response?.data || error.message);
    throw error;
  }
};

// 7️⃣ Get stocks for a specific watchlist
export const getWatchlistStocks = async (watchlistId: number) => {
  try {
    const response = await api.get(`/watchlists/${watchlistId}`);
    console.log('Watchlist stocks:', response.data);
    return response.data.watchlist?.items || [];
  } catch (error: any) {
    console.error('Failed to fetch watchlist stocks:', error.response?.data || error.message);
    return [];
  }
};

export default api;
