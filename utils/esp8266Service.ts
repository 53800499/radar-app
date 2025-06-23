/** @format */

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { Alert, addAlert } from "./database";
import { ESP8266_BASE_URL, checkESP8266Connectivity } from "./networkConfig";
import { sendAlertNotification } from "./notificationService";

// Nom de la tâche en arrière-plan
const BACKGROUND_FETCH_TASK = "background-fetch-task";

// État de la connexion
let isPolling = false;
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;
let isOfflineMode = false;

// Variables pour le dédoublonnage des alertes
let lastAlertMessage: string | null = null;
let lastAlertTimestamp = 0;
const ALERT_DEBOUNCE_TIME = 60 * 1000; // 1 minute

// Interface pour les données radar
interface RadarData {
  angle: number;
  distance: number;
  objectCount: number;
  timestamp: string;
}

// Interface pour les alertes radar
interface RadarAlert {
  type: string;
  message: string;
  timestamp: string;
  objectCount: number;
  expectedCount: number;
  active: boolean;
}

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

// Récupérer les données radar actuelles
export const fetchRadarData = async (): Promise<RadarData | null> => {
  try {
    const response = await fetch(`${ESP8266_BASE_URL}/radar`);
    if (!response.ok) {
      console.log("Erreur de réponse du serveur radar:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.log("Aucune donnée radar disponible");
      return null;
    }

    return {
      angle: data.angle,
      distance: data.distance,
      objectCount: data.objectCount,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.log("Erreur lors de la récupération des données radar:", error);
    return null;
  }
};

// Récupérer la dernière alerte
export const fetchLastAlert = async (): Promise<RadarAlert | null> => {
  try {
    const response = await fetch(`${ESP8266_BASE_URL}/alert`);

    if (response.status === 404) {
      return null; // Aucune alerte active
    }

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const alert = await response.json();
    return {
      type: alert.type,
      message: alert.message,
      timestamp: alert.timestamp,
      objectCount: alert.objectCount,
      expectedCount: alert.expectedCount,
      active: alert.active
    };
  } catch (error) {
    console.log("Erreur lors de la récupération de l'alerte:", error);
    return null;
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

    const response = await fetch(`${ESP8266_BASE_URL}/alerts`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    const radarAlerts = data.alerts || [];
    console.log(`${radarAlerts.length} alertes récupérées`);

    const alerts: Alert[] = [];

    // Convertir les alertes radar en alertes de l'application
    for (const radarAlert of radarAlerts) {
      const alert: Alert = {
        type: radarAlert.type === "surplus" ? "surplus" : "manque",
        message: radarAlert.message,
        date: new Date().toISOString(),
        videoUri: null,
        screenshotUri: null,
        read: false
      };

      // Sauvegarder l'alerte localement
      await addAlert(alert);
      alerts.push(alert);
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

// Configurer les paramètres du radar
export const configureRadar = async (params: {
  expectedCount?: number;
  detectionThreshold?: number;
}): Promise<boolean> => {
  try {
    const response = await fetch(`${ESP8266_BASE_URL}/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    console.log("Configuration radar mise à jour");
    return true;
  } catch (error) {
    console.error("Erreur lors de la configuration du radar:", error);
    return false;
  }
};

// Récupérer la configuration actuelle du radar
export const getRadarConfig = async (): Promise<{
  expectedCount: number;
  detectionThreshold: number;
} | null> => {
  try {
    const response = await fetch(`${ESP8266_BASE_URL}/config`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const config = await response.json();
    return {
      expectedCount: config.expectedCount,
      detectionThreshold: config.detectionThreshold
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de la configuration:", error);
    return null;
  }
};

// Réinitialiser les alertes
export const resetAlerts = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${ESP8266_BASE_URL}/reset`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    console.log("Alertes réinitialisées");
    return true;
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des alertes:", error);
    return false;
  }
};

// Démarrer l'écoute des alertes (polling)
export const startAlertListener = (onAlert: (alert: Alert) => void) => {
  if (isPolling) {
    console.log("L'écoute des alertes est déjà active");
    return;
  }

  isPolling = true;
  console.log("Démarrage de l'écoute des alertes...");

  const pollAlerts = async () => {
    try {
      // Vérifier la connectivité
      const isConnected = await checkESP8266Connectivity();
      if (!isConnected) {
        console.log("ESP8266 non accessible, passage en mode hors ligne");
        isOfflineMode = true;
        return;
      }

    isOfflineMode = false;

        // Récupérer la dernière alerte
        const radarAlert = await fetchLastAlert();

        if (radarAlert && radarAlert.active) {
          const currentTime = Date.now();
          const currentMessage = radarAlert.message;

          // Si le message est différent OU si plus d'une minute s'est écoulée
          if (
            currentMessage !== lastAlertMessage ||
            currentTime - lastAlertTimestamp > ALERT_DEBOUNCE_TIME
          ) {
            // Mettre à jour le suivi pour le dédoublonnage
            lastAlertMessage = currentMessage;
            lastAlertTimestamp = currentTime;

            // Créer une alerte pour l'application
            const alert: Alert = {
              type: radarAlert.type,
              message: radarAlert.message,
              date: new Date().toISOString(),
              videoUri: null,
              screenshotUri: null,
              read: false
            };

            // Sauvegarder l'alerte localement
            await addAlert(alert);

            // Notifier l'application
            onAlert(alert);

            // Envoyer une notification
            await sendAlertNotification(alert.type, alert.message);
          } else {
            // Message identique en moins d'une minute, on l'ignore
            console.log(
              `[Debounce] Alerte ignorée (identique): "${currentMessage}"`
            );
          }
        } else {
          // Pas d'alerte active, on réinitialise le suivi
          lastAlertMessage = null;
        }
    } catch (error) {
      console.error("Erreur lors du polling des alertes:", error);
    }
  };

  // Polling toutes les 2 secondes
  pollingInterval = setInterval(pollAlerts, 2000);

  // Première vérification immédiate
  pollAlerts();

  // Fonction de nettoyage
  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    isPolling = false;
    console.log("Écoute des alertes arrêtée");
  };
};

// Arrêter l'écoute des alertes
export const stopAlertListener = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  isPolling = false;
  console.log("Écoute des alertes arrêtée");
};
