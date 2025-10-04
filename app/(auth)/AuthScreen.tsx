// app/(auth)/AuthScreen.tsx (updated to use single "name" field for registration)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Theme from '../../constants/theme'; // Assuming this is correctly imported
import { Ionicons } from '@expo/vector-icons';
import { loginUser, registerUser } from '../../services/_authService'; // Adjust path if needed

export default function AuthScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateLogin = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email.trim()) newErrors.email = '*required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = '*invalid email';
    if (!password) newErrors.password = '*required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = '*required';
    if (!email.trim()) newErrors.email = '*required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = '*invalid email';
    if (!phone.trim()) newErrors.phone = '*required';
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = '*invalid phone';
    if (!password) newErrors.password = '*required';
    else if (password.length < 8) newErrors.password = '*min 8 chars'; // Updated to common min length
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    try {
      const data = await loginUser({ email, password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      Alert.alert('Success', 'Logged in successfully!');
      router.replace('/(tabs)/news');
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'An error occurred. Please try again.';
      if (error.response?.status === 422) {
        message = error.response.data.message || 'Validation failed. Check fields.';
      } else if (error.message === 'Network Error') {
        message = 'Network Error: Unable to connect to server.';
      } else if (error.response) {
        message = error.response.data?.message || 'Server error.';
      }
      Alert.alert('Login Failed', message);
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    try {
      const data = await registerUser({
        name,
        email,
        phone,
        password,
        // password_confirmation: password, // Uncomment if server requires
      });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      Alert.alert('Success', 'Registered successfully!');
      router.replace('/(tabs)/news');
    } catch (error: any) {
      console.error('Register error:', error);
      let message = 'An error occurred. Please try again.';
      if (error.response?.status === 422) {
        message = error.response.data.message || 'Validation failed. Check name and password.';
      } else if (error.message === 'Network Error') {
        message = 'Network Error: Unable to connect to server.';
      } else if (error.response) {
        message = error.response.data?.message || 'Server error.';
      }
      Alert.alert('Register Failed', message);
    }
  };

  const handleGoogleAuth = () => {
    Alert.alert('Google Auth', 'Continue with Google pressed');
  };

  const renderError = (field: string) =>
    errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.getStarted}>Basilstar</Text>
        <Text style={styles.appName}>Get Started now</Text>
        <Text style={styles.subText}>
          Create an account or log in to explore about our app
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => {
            setActiveTab('login');
            setErrors({});
          }}
        >
          <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => {
            setActiveTab('register');
            setErrors({});
          }}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        {activeTab === 'register' && (
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Name</Text>
              {renderError('name')}
            </View>
            <TextInput
              style={[styles.input, errors.name && { borderColor: 'red' }]}
              placeholder="Enter your name"
              placeholderTextColor={Theme.Colors.light.icon}
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Email</Text>
            {renderError('email')}
          </View>
          <TextInput
            style={[styles.input, errors.email && { borderColor: 'red' }]}
            placeholder="Enter your email"
            placeholderTextColor={Theme.Colors.light.icon}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {activeTab === 'register' && (
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Phone</Text>
              {renderError('phone')}
            </View>
            <TextInput
              style={[styles.input, errors.phone && { borderColor: 'red' }]}
              placeholder="Enter your phone number"
              placeholderTextColor={Theme.Colors.light.icon}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            {renderError('password')}
          </View>
          <TextInput
            style={[styles.input, errors.password && { borderColor: 'red' }]}
            placeholder="Enter your password"
            placeholderTextColor={Theme.Colors.light.icon}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {activeTab === 'login' && (
          <View style={styles.extraOptions}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
              <Text style={styles.rememberMe}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={activeTab === 'login' ? handleLogin : handleRegister}
        >
          <Text style={styles.buttonText}>
            {activeTab === 'login' ? 'Login' : 'Register'}
          </Text>
        </TouchableOpacity>

        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>Or</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleAuth}>
          <Ionicons
            name="logo-google"
            size={20}
            color="#DB4437"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.Colors.light.background, padding: 20, justifyContent: 'center' },
  headerContainer: { marginBottom: 30, alignItems: 'center' },
  getStarted: { fontSize: 24, fontWeight: '600', color: Theme.Colors.light.tint, marginBottom: 8 },
  appName: { fontSize: 32, fontWeight: 'bold', color: Theme.Colors.light.text, marginBottom: 12 },
  subText: { fontSize: 12, color: '#12353084', textAlign: 'center', width: '70%' },
  tabContainer: { flexDirection: 'row', marginBottom: 30, borderRadius: 15, backgroundColor: '#F5F6F9' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: Theme.Colors.light.tint },
  tabText: { fontSize: Theme.Typography.subHeading.fontSize, fontFamily: Theme.Typography.subHeading.fontFamily, color: Theme.Colors.light.text, fontWeight: Theme.FontWeights.semiBold },
  activeTabText: { color: Theme.Colors.light.background },
  formContainer: {},
  inputGroup: { marginBottom: 15 },
  label: { fontSize: Theme.Typography.paragraph.fontSize, fontFamily: Theme.Typography.paragraph.fontFamily, color: Theme.Colors.light.text, marginBottom: 5, fontWeight: Theme.FontWeights.semiBold },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { backgroundColor: '#E4E5E73D', color: Theme.Colors.light.text, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, fontFamily: Theme.Fonts.body, borderColor: '#00000030', borderWidth: 1 },
  extraOptions: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: Theme.Colors.light.text, borderRadius: 4, marginRight: 8 },
  checkboxChecked: { backgroundColor: Theme.Colors.light.tint },
  rememberMe: { fontSize: 14, color: Theme.Colors.light.text },
  forgotPassword: { fontSize: 14, color: Theme.Colors.light.tint, fontWeight: '600' },
  button: { backgroundColor: Theme.Colors.light.tint, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: Theme.Colors.light.background, fontSize: Theme.Typography.subHeading.fontSize, fontFamily: Theme.Fonts.heading, fontWeight: Theme.FontWeights.bold },
  orContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#E4E5E73D' },
  orText: { marginHorizontal: 10, color: Theme.Colors.light.text, fontWeight: '600' },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00000030', backgroundColor: '#E4E5E73D', paddingVertical: 12, borderRadius: 10 },
  googleText: { color: '#1A1C1E', fontWeight: '600', fontSize: 16 },
  errorText: { color: 'red', fontSize: 12 },
});
