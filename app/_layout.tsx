/** @format */

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { initDatabase } from "../utils/database";
import { registerBackgroundTask } from "../utils/esp8266Service";
import {
  registerForPushNotificationsAsync,
  setupNotificationHandlers
} from "../utils/notificationService";

import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbLoaded, setDbLoaded] = useState(false);
  const [fontLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf")
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🚀 Initialisation de l'application...");

        // Initialiser la base de données
        await initDatabase();
        setDbLoaded(true);
        console.log("✅ Base de données initialisée");

        // Initialiser les notifications
        const token = await registerForPushNotificationsAsync();
        console.log("📱 Token de notification:", token);

        // Enregistrer les tâches en arrière-plan
        await registerBackgroundTask();
        console.log("🔄 Tâches en arrière-plan enregistrées");

        // Configurer les handlers de notifications
        const cleanup = setupNotificationHandlers(
          (notification) => {
            console.log("📨 Notification reçue:", notification);
          },
          (response) => {
            console.log("👆 Réponse à la notification:", response);
          }
        );

        console.log("✅ Application initialisée avec succès");
        return cleanup;
      } catch (error) {
        console.error("❌ Erreur lors de l'initialisation:", error);
      }
    };

    initializeApp();
  }, []);

  if (!dbLoaded || !fontLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen
            name="radar-visualization"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="esp8266-diagnostic"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
