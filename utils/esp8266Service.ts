/** @format */

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { Alert, addAlert } from "./database";
import {
  NETWORK_CONFIG,
  checkESP8266Connectivity,
  getBaseUrl,
  getWebSocketUrl
} from "./networkConfig";
import { sendAlertNotification } from "./notificationService";

// Nom de la tâche en arrière-plan
const BACKGROUND_FETCH_TASK = "background-fetch-task";

// État de la connexion
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let isConnecting = false;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let isOfflineMode = NETWORK_CONFIG.OFFLINE_MODE.ENABLED;

// Définir la tâche en arrière-plan
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const alerts = await fetchAlertsFromESP8266();
    if (alerts.length > 0) {
      // Envoyer une notification pour chaque nouvelle alerte
      for (const alert of alerts) {
        await sendAlertNotification(alert.type, alert.message);
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background fetch failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Enregistrer la tâche en arrière-plan
export const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60, // 1 minute
      stopOnTerminate: false,
      startOnBoot: true
    });
    console.log("Background task registered");
  } catch (error) {
    console.error("Failed to register background task:", error);
  }
};

// Récupérer les alertes de l'ESP8266
export const fetchAlertsFromESP8266 = async (): Promise<Alert[]> => {
  try {
    // Vérifier la connectivité si on n'est pas en mode hors ligne
    if (!isOfflineMode) {
      const isConnected = await checkESP8266Connectivity();
      if (!isConnected) {
        console.log("Passage en mode hors ligne - ESP8266 non accessible");
        isOfflineMode = true;
        return [];
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_CONFIG.ESP8266.HTTP_TIMEOUT
    );

    const response = await fetch(`${getBaseUrl()}/alerts`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const alerts = await response.json();
    console.log(`${alerts.length} alertes récupérées`);

    // Sauvegarder les alertes localement
    for (const alert of alerts) {
      await addAlert({
        type: alert.type,
        message: alert.message,
        date: new Date().toISOString(),
        videoUri: alert.videoUri,
        screenshotUri: alert.screenshotUri,
        read: false
      });
    }

    // Si on a réussi à récupérer les alertes, on n'est plus en mode hors ligne
    isOfflineMode = false;
    return alerts;
  } catch (error) {
    console.log("Mode hors ligne - Erreur de communication:", error);
    isOfflineMode = true;
    return [];
  }
};

// Gérer la reconnexion WebSocket
const handleReconnect = (connect: () => void) => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  if (reconnectAttempts < NETWORK_CONFIG.ESP8266.MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(
      `Tentative de reconnexion ${reconnectAttempts}/${
        NETWORK_CONFIG.ESP8266.MAX_RECONNECT_ATTEMPTS
      } dans ${NETWORK_CONFIG.ESP8266.RECONNECT_DELAY / 1000}s`
    );
    reconnectTimeout = setTimeout(
      connect,
      NETWORK_CONFIG.ESP8266.RECONNECT_DELAY
    );
  } else {
    console.log("Mode hors ligne - Maximum de tentatives atteint");
    isOfflineMode = true;
  }
};

// Démarrer l'écoute des alertes
export const startAlertListener = (onAlert: (alert: Alert) => void) => {
  const connect = async () => {
    if (
      isConnecting ||
      reconnectAttempts >= NETWORK_CONFIG.ESP8266.MAX_RECONNECT_ATTEMPTS
    ) {
      return;
    }

    isConnecting = true;

    // Vérifier la connectivité si on n'est pas en mode hors ligne
    if (!isOfflineMode) {
      const isConnected = await checkESP8266Connectivity();
      if (!isConnected) {
        console.log("Passage en mode hors ligne - ESP8266 non accessible");
        isOfflineMode = true;
        isConnecting = false;
        handleReconnect(connect);
        return;
      }
    }

    try {
      console.log("Tentative de connexion WebSocket...");
      ws = new WebSocket(getWebSocketUrl());

      ws.onopen = () => {
        console.log("WebSocket connecté");
        isConnecting = false;
        reconnectAttempts = 0;
        isOfflineMode = false;
      };

      ws.onmessage = async (event) => {
        try {
          const alert = JSON.parse(event.data) as Alert;
          onAlert(alert);

          // Envoyer une notification pour l'alerte
          await sendAlertNotification(alert.type, alert.message);
        } catch (error) {
          console.error("Erreur lors du traitement de l'alerte:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("Erreur WebSocket:", error);
        isConnecting = false;
        handleReconnect(connect);
      };

      ws.onclose = () => {
        console.log("WebSocket déconnecté");
        // Tentative de reconnexion après un délai
        setTimeout(() => startAlertListener(onAlert), 5000);
      };
    } catch (error) {
      console.error("Erreur de création WebSocket:", error);
      isConnecting = false;
      handleReconnect(connect);
    }
  };

  // Démarrer la connexion
  connect();

  // Nettoyage
  return () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (ws) {
      ws.close();
    }
    isConnecting = false;
    reconnectAttempts = 0;
  };
};
