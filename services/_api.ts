// app/services/_api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://basilstar.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return config;
});

// Response interceptor for detailed error logging
api.interceptors.response.use(
  (response) => {
    console.log(`API Success: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error('Detailed API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
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

// Watchlist APIs

// 1️⃣ Get all watchlists
export const getWatchlists = async () => {
  try {
    const response = await api.get('/watchlists');
    console.log('Watchlists API Response:', response.data);
    return response.data.watchlists || response.data.data || [];
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
export const updateWatchlist = async (id: number, data: { name?: string; items?: string[] }) => {
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

// 5️⃣ Add stock to watchlist - COMPLETELY REWRITTEN
export const addStockToWatchlist = async (watchlistId: number, symbol: string) => {
  try {
    console.log(`Adding ${symbol} to watchlist ${watchlistId}`);
    
    // First, get the current watchlist to see its structure
    const currentWatchlist = await api.get(`/watchlists/${watchlistId}`);
    console.log('Current watchlist structure:', currentWatchlist.data);
    
    const watchlistData = currentWatchlist.data.watchlist || currentWatchlist.data.data;
    
    if (!watchlistData) {
      throw new Error('Could not fetch current watchlist data');
    }

    // Handle different possible structures
    let currentItems: string[] = [];
    
    if (Array.isArray(watchlistData.items)) {
      currentItems = watchlistData.items;
    } else if (watchlistData.symbols) {
      currentItems = watchlistData.symbols;
    } else if (watchlistData.stocks) {
      currentItems = watchlistData.stocks;
    }
    
    // Check if symbol already exists
    if (currentItems.includes(symbol)) {
      throw new Error(`${symbol} is already in this watchlist`);
    }

    // Add new symbol
    const updatedItems = [...currentItems, symbol];
    
    // Try different update approaches
    let updateData: any = { items: updatedItems };
    
    // Update the watchlist
    const response = await api.put(`/watchlists/${watchlistId}`, updateData);
    console.log('Stock added successfully:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Failed to add stock to watchlist:', error);
    
    // If PUT doesn't work, try POST to a specific endpoint
    if (error.response?.status === 405) {
      try {
        console.log('Trying alternative endpoint...');
        const response = await api.post(`/watchlists/${watchlistId}/stocks`, {
          symbol: symbol
        });
        console.log('Stock added via alternative endpoint:', response.data);
        return response.data;
      } catch (postError: any) {
        console.error('Alternative endpoint also failed:', postError);
        throw new Error(`Failed to add stock: ${postError.response?.data?.message || postError.message}`);
      }
    }
    
    throw new Error(`Failed to add stock: ${error.response?.data?.message || error.message}`);
  }
};

// 6️⃣ Remove stock from watchlist
export const removeStockFromWatchlist = async (watchlistId: number, symbol: string) => {
  try {
    console.log(`Removing ${symbol} from watchlist ${watchlistId}`);
    
    // Get current watchlist
    const currentWatchlist = await api.get(`/watchlists/${watchlistId}`);
    const watchlistData = currentWatchlist.data.watchlist || currentWatchlist.data.data;
    
    if (!watchlistData) {
      throw new Error('Could not fetch current watchlist data');
    }

    let currentItems: string[] = [];
    
    if (Array.isArray(watchlistData.items)) {
      currentItems = watchlistData.items;
    } else if (watchlistData.symbols) {
      currentItems = watchlistData.symbols;
    } else if (watchlistData.stocks) {
      currentItems = watchlistData.stocks;
    }
    
    // Filter out the symbol to remove
    const updatedItems = currentItems.filter((item: string) => item !== symbol);
    
    // Update watchlist
    const response = await api.put(`/watchlists/${watchlistId}`, {
      items: updatedItems
    });
    
    console.log('Stock removed successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to remove stock from watchlist:', error);
    
    // Try DELETE endpoint as fallback
    if (error.response?.status === 405) {
      try {
        const response = await api.delete(`/watchlists/${watchlistId}/stocks/${symbol}`);
        console.log('Stock removed via DELETE endpoint:', response.data);
        return response.data;
      } catch (deleteError: any) {
        console.error('DELETE endpoint also failed:', deleteError);
        throw new Error(`Failed to remove stock: ${deleteError.response?.data?.message || deleteError.message}`);
      }
    }
    
    throw new Error(`Failed to remove stock: ${error.response?.data?.message || error.message}`);
  }
};

// 7️⃣ Get stocks for a specific watchlist
export const getWatchlistStocks = async (watchlistId: number) => {
  try {
    const response = await api.get(`/watchlists/${watchlistId}`);
    console.log("Watchlist stocks response:", response.data);
    
    const watchlistData = response.data.watchlist || response.data.data;
    
    if (!watchlistData) {
      return [];
    }

    // Handle different response structures
    if (Array.isArray(watchlistData.items)) {
      return watchlistData.items;
    } else if (watchlistData.symbols) {
      return watchlistData.symbols;
    } else if (watchlistData.stocks) {
      return watchlistData.stocks;
    }
    
    return [];
  } catch (error: any) {
    console.error("Failed to fetch watchlist stocks:", error.response?.data || error.message);
    return [];
  }
};

// ================= PROFILE APIs =================

// 1️⃣ Get all profiles
export const getProfiles = async () => {
  try {
    const response = await api.get('/profiles');
    return response.data.profiles || response.data.data || [];
  } catch (error: any) {
    console.error('Failed to fetch profiles:', error.response?.data || error.message);
    return [];
  }
};

// 2️⃣ Get profile by ID
export const getProfileById = async (id: number) => {
  try {
    const response = await api.get(`/profiles/${id}`);
    return response.data.profile || response.data.data || null;
  } catch (error: any) {
    console.error(`Failed to fetch profile ${id}:`, error.response?.data || error.message);
    return null;
  }
};

// 3️⃣ Create profile
export const createProfile = async (data: {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}) => {
  try {
    const response = await api.post('/profiles', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create profile:', error.response?.data || error.message);
    throw error;
  }
};

// 4️⃣ Update profile
export const updateProfile = async (id: number, data: any) => {
  try {
    let headers: any = {};

    // Detect if FormData
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await api.put(`/profiles/${id}`, data, { headers });
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update profile ${id}:`, error.response?.data || error.message);
    throw error;
  }
};


// 5️⃣ Delete profile
export const deleteProfile = async (id: number) => {
  try {
    const response = await api.delete(`/profiles/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to delete profile ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// 6️⃣ Update profile phone only
export const updateProfilePhone = async (id: number, phone: string) => {
  try {
    const response = await api.put(`/profiles/${id}`, { phone });
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update phone for profile ${id}:`, error.response?.data || error.message);
    throw error;
  }
};


export default api;