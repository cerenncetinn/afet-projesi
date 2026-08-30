import { Stack } from "expo-router";

import OfflineSyncManager from "../src/components/OfflineSyncManager";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgotPassword" />

        {/* Afetzede Grubu */}
        <Stack.Screen name="afetzede/afetzedePaneli" />

        {/* Gönüllü Grubu */}
        <Stack.Screen name="gonullu/operasyonHaritasi" />
        <Stack.Screen name="gonullu/gonulluPaneli" />
        <Stack.Screen name="gonullu/ihbarAnalizi" />
        <Stack.Screen name="gonullu/profil" />
        <Stack.Screen name="gonullu/yoldayim" />
      </Stack>

      <OfflineSyncManager />
    </>
  );
}
