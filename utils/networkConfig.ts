/** @format */

// Configuration réseau
export const NETWORK_CONFIG = {
  // Configuration de l'ESP32-CAM
  ESP32: {
    // Adresse IP de l'ESP32-CAM - À modifier selon votre réseau
    IP: "192.168.46.240",
    // Port pour les requêtes HTTP
    HTTP_PORT: 80,
    // Port pour le streaming vidéo
    STREAM_PORT: 81,
    // Timeout pour les requêtes HTTP (en ms)
    HTTP_TIMEOUT: 5000,
    // Délai entre les tentatives de reconnexion (en ms)
    RECONNECT_DELAY: 30000,
    // Nombre maximum de tentatives de reconnexion
    MAX_RECONNECT_ATTEMPTS: 3
  },
  // Configuration de l'ESP8266
  ESP8266: {
    // Adresse IP de l'ESP8266 - À modifier selon votre réseau
    IP: "192.168.46.241",
    // Port pour les requêtes HTTP
    HTTP_PORT: 80,
    // Port pour le WebSocket
    WS_PORT: 81,
    // Timeout pour les requêtes HTTP (en ms)
    HTTP_TIMEOUT: 5000,
    // Délai entre les tentatives de reconnexion (en ms)
    RECONNECT_DELAY: 30000,
    // Nombre maximum de tentatives de reconnexion
    MAX_RECONNECT_ATTEMPTS: 3
  },
  // Configuration du mode hors ligne
  OFFLINE_MODE: {
    // Activer le mode hors ligne par défaut
    ENABLED: true,
    // Délai de synchronisation en mode hors ligne (en ms)
    SYNC_DELAY: 60000
  }
};

// Vérifier la connectivité avec l'ESP32-CAM
export const checkESP32Connectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_CONFIG.ESP32.HTTP_TIMEOUT
    );
    const response = await fetch(
      `http://${NETWORK_CONFIG.ESP32.IP}:${NETWORK_CONFIG.ESP32.HTTP_PORT}/status`,
      {
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log("ESP32-CAM non accessible:", error);
    return false;
  }
};

// Vérifier la connectivité avec l'ESP8266
export const checkESP8266Connectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_CONFIG.ESP8266.HTTP_TIMEOUT
    );
    const response = await fetch(
      `http://${NETWORK_CONFIG.ESP8266.IP}:${NETWORK_CONFIG.ESP8266.HTTP_PORT}/status`,
      {
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log("ESP8266 non accessible:", error);
    return false;
  }
};

// Obtenir l'URL de base pour les requêtes HTTP
export const getBaseUrl = (): string => {
  return `http://${NETWORK_CONFIG.ESP8266.IP}:${NETWORK_CONFIG.ESP8266.HTTP_PORT}`;
};

// Obtenir l'URL pour le WebSocket
export const getWebSocketUrl = (): string => {
  return `ws://${NETWORK_CONFIG.ESP8266.IP}:${NETWORK_CONFIG.ESP8266.WS_PORT}/ws`;
};

// Obtenir l'URL pour le streaming vidéo
export const getStreamUrl = (): string => {
  return `http://${NETWORK_CONFIG.ESP32.IP}:${NETWORK_CONFIG.ESP32.STREAM_PORT}/stream`;
};
