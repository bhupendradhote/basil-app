import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const renderIconWithLabel = (
    focused: boolean,
    IconComponent: any,
    iconName: string,
    size: number,
    label: string
  ) => {
    const bgColor = focused ? '#123530' : 'transparent';
    const textColor = focused ? '#fff' : '#123530';

    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: 65,    // slightly smaller container
          height: 55,
          borderRadius: 10,
          backgroundColor: bgColor,
          paddingVertical: 2,
        }}
      >
        <IconComponent name={iconName} size={size} color={textColor} />
        <Text style={{ color: textColor, fontSize: 10, fontWeight: '600', marginTop: 2 }}>
          {label}
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 13,
          // respect device bottom safe area and provide comfortable touch area
          paddingBottom: Math.max(8, insets.bottom || 0) + 6,
          // increase height to account for inset
          height: 60 + (insets.bottom || 0),
          backgroundColor: colorScheme === 'dark' ? '#000' : '#ffffffc5',
          // make sure tab bar appears above other absolute-positioned UI
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 20,
          zIndex: 20,
        },
      }}
    >
      <Tabs.Screen
        name="news"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIconWithLabel(focused, Ionicons, 'newspaper-outline', 20, 'News'),
        }}
      />
      <Tabs.Screen
        name="technical"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIconWithLabel(focused, MaterialCommunityIcons, 'chart-bar', 20, 'Technical'),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIconWithLabel(focused, MaterialIcons, 'dashboard', 20, 'Dashboard'),
        }}
      />
      <Tabs.Screen
        name="fundamental"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIconWithLabel(focused, FontAwesome5, 'chart-line', 20, 'Fundamental'),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          tabBarIcon: ({ focused }) =>
            renderIconWithLabel(focused, Ionicons, 'bookmark-outline', 20, 'Watchlist'),
        }}
      />
    </Tabs>
  );
}
