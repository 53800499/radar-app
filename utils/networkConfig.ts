/** @format */


// --- Configuration des adresses IP ---
// Remplacez ces adresses par celles de vos ESP
export const ESP8266_IP = "192.168.186.240"; // Adresse de l'ESP8266 pour le radar
export const ESP32_CAM_IP = "10.58.156.208"; // Adresse de l'ESP32-CAM pour la vidéo

// URL de base pour les API
export const ESP8266_BASE_URL = `http://${ESP8266_IP}`;
export const ESP32_CAM_STREAM_URL = `http://${ESP32_CAM_IP}:81/stream`;
export const ESP32_CAM_STATUS_URL = `http://${ESP32_CAM_IP}/status`;

const HTTP_TIMEOUT = 5000;

// Vérifier la connectivité avec l'ESP32-CAM
export const checkESP32Connectivity = async (ip: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT);
    const response = await fetch(`http://${ip}/status`, {
      signal: controller.signal
    });
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
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT);
    const response = await fetch(`${ESP8266_BASE_URL}/status`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log("ESP8266 non accessible:", error);
    return false;
  }
};
