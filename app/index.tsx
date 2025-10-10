import { StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/intro/screen2');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]); // ✅ include router dependency

  return (
    <SafeAreaView style={styles.container}>
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
    backgroundColor: '#123530',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
});
