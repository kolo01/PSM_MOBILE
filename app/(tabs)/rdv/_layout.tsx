import { Stack } from "expo-router";

export default function RdvStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="nouveau" />
    </Stack>
  );
}
