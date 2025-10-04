import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // removes top header and back button
        gestureEnabled: false, // optional: disable iOS swipe back
      }}
    />
  );
}
