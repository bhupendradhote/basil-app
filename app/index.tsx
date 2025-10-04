import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  // Automatically navigate after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/intro/screen2');
    }, 3000); // 3000ms = 3s

    // Cleanup in case component unmounts before 3s
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <Image
        source={require('@/assets/images/logo/basillog.png')}
        style={styles.logo}
        resizeMode="contain"
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#123530', // Page background color
  },
  logo: { width: 150, height: 150, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#ffffff' }, // Text color
});
