/** @format */

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

// Fonction pour enregistrer le token de notification
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1a73e8"
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }
    // Obtenir le token Expo Push
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      })
    ).data;
    console.log("Expo Push Token:", token);
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

// Fonction pour envoyer une notification locale
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH
    },
    trigger: null // null signifie que la notification sera envoyée immédiatement
  });
}

// Fonction pour envoyer une notification programmée
export async function scheduleNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH
    },
    trigger
  });
}

// Fonction pour gérer les notifications reçues
export function setupNotificationHandlers(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponseReceived: (
    response: Notifications.NotificationResponse
  ) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(
      onNotificationResponseReceived
    );

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// Fonction pour vérifier les permissions de notification
export async function checkNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

// Fonction pour demander les permissions de notification
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Fonction pour envoyer une notification d'alerte améliorée
export async function sendAlertNotification(
  type: string,
  message: string,
  data?: any
) {
  try {
    // Vérifier les permissions
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.log("Permissions de notification non accordées");
      return;
    }

    const title = `🚨 Alerte ${type}`;
    const body = message;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: "alert",
          alertType: type,
          timestamp: new Date().toISOString(),
          ...data
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        badge: 1
      },
      trigger: null // Notification immédiate
    });
    
    console.log("Notification d'alerte envoyée:", title);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification d'alerte:", error);
  }
}

// Fonction pour envoyer une notification de mouvement détecté
export async function sendMotionDetectionNotification(
  location: string,
  confidence: number
) {
  const title = "Mouvement détecté";
  const body = `Mouvement détecté à ${location} (confiance: ${confidence}%)`;
  await sendLocalNotification(title, body, {
    type: "motion",
    location,
    confidence
  });
}

// Fonction pour envoyer une notification de perte de connexion
export async function sendConnectionLostNotification() {
  const title = "Perte de connexion";
  const body = "La connexion avec la caméra a été perdue";
  await sendLocalNotification(title, body, {
    type: "connection",
    severity: "high"
  });
}

// Fonction pour envoyer une notification de batterie faible
export async function sendLowBatteryNotification(level: number) {
  const title = "Batterie faible";
  const body = `Le niveau de batterie est à ${level}%`;
  await sendLocalNotification(title, body, {
    type: "battery",
    level
  });
}
