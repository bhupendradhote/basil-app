// app/services/_authService.ts

import api from './_api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RegisterData {
  name: string; // Single name field to match server expectation
  email: string;
  phone: string;
  password: string;
  password_confirmation?: string; // Add if server requires confirmation
}

interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  try {
    const response = await api.post('/register', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (data: LoginData) => {
  try {
    const response = await api.post('/login', data);
    // Save token if login successful
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

// -------- Logout Function --------
export const logoutUser = async () => {
  try {
    // Call logout API
    await api.post('/logout'); // server invalidates token
  } catch (error) {
    console.warn('Logout API failed, clearing local session anyway.');
  } finally {
    // Clear token from AsyncStorage
    await AsyncStorage.removeItem('token');
  }
};
