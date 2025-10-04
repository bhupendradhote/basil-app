import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ✅ Define type-safe icon names using Ionicons glyph map
type SettingOption = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  iconColor?: string;
  textColor?: string;
};

const SettingsScreen = () => {
  const router = useRouter();
  const appVersion = '25.0.1';

  const settingsOptions: SettingOption[] = [
    {
      icon: 'key-outline',
      title: 'Change password',
      onPress: () => router.push('/pages/profile/changePasswordScreen'),
      iconColor: '#123530',
    },
    {
      icon: 'help-circle-outline',
      title: 'Help center',
      onPress: () => Linking.openURL('https://help.yourcompany.com'),
      iconColor: '#123530',
    },
    {
      icon: 'document-text-outline',
      title: 'Terms and condition',
      onPress: () => Linking.openURL('https://yourcompany.com/terms'),
      iconColor: '#123530',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy policy',
      onPress: () => Linking.openURL('https://yourcompany.com/privacy'),
      iconColor: '#123530',
    },
    {
      icon: 'log-out-outline',
      title: 'Log out',
      onPress: () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: () => console.log('User logged out'),
          },
        ]);
      },
      iconColor: '#D9534F',
      textColor: '#D9534F',
    },
    {
      icon: 'trash-outline',
      title: 'Delete my Account',
      onPress: () => {
        Alert.alert('Delete Account', 'This action cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => console.log('Account deletion requested'),
          },
        ]);
      },
      iconColor: '#D9534F',
      textColor: '#D9534F',
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A3D2E" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Settings</Text>
        </View>

        {/* Settings List */}
        <View style={styles.listContainer}>
          {settingsOptions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.item}
              onPress={item.onPress}
            >
              <View style={styles.itemLeft}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.iconColor || '#123530'}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.itemText,
                    { color: item.textColor || '#123530' },
                  ]}
                >
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>version {appVersion}</Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFBF5',
    paddingHorizontal: 20,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#123530',
    marginLeft: 14,
  },
  listContainer: {
    marginTop: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#EAEAEA',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#123530',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 50,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    paddingTop: 14,
  },
  versionText: {
    color: '#999',
    fontSize: 13,
  },
});
