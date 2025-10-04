import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Intro / Splash Screens */}
        <Stack.Screen name="intro/screen2" options={{ headerShown: false }} />
        <Stack.Screen name="pages/todaysOutlook/todaysOutlook" options={{ headerShown: false }} />
        <Stack.Screen name="pages/todaysOutlook/todaysOutlookDetails" options={{ headerShown: false }} />
        <Stack.Screen name="pages/learning/learning" options={{ headerShown: false }} />
        <Stack.Screen name="pages/learning/blogDetails" options={{ headerShown: false }} />
        <Stack.Screen name="pages/learning/blogPostDetails" options={{ headerShown: false }} />
        <Stack.Screen name="pages/learning/videoDetails" options={{ headerShown: false }} />
        <Stack.Screen name="pages/news/newsDetails" options={{ headerShown: false }} />
        <Stack.Screen name="pages/profile/userProfile" options={{ headerShown: false }} />
        <Stack.Screen name="pages/calculator/calculator" options={{ headerShown: false }} />
        <Stack.Screen name="pages/profile/notificationandAlerts" options={{ headerShown: false }} />
        <Stack.Screen name="pages/profile/settingsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/profile/changePasswordScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/profile/PersonalInformation" options={{ headerShown: false }} />
        <Stack.Screen name="pages/fundamental/fundamental" options={{ headerShown: false }} />
        <Stack.Screen name="pages/fundamental/companyProfileTabScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/fundamental/corporateActionsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/fundamental/keyMetricsTbScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/fundamental/cashFlowTabScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/fundamental/technicalAnalysisTabScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/fundamental/overviewTabScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/fundamental/fundamentalAnalysisTabScreen" options={{ headerShown: false }} />
        <Stack.Screen name="pages/upcomingEvents/upcomingEvents" options={{ headerShown: false }} />
        {/* Auth group */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Optional modal */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
