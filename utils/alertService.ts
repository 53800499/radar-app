/** @format */

import { addAlert, markAlertAsRead as markAlertAsReadDB } from "./database";
import { sendLocalNotification } from "./notificationService";

export interface RadarAlert {
  type: "supplis" | "manque";
  message: string;
  distance: number;
  objectCount: number;
  initialObjectCount: number;
}

// Fonction pour traiter une nouvelle alerte du radar
export const handleRadarAlert = async (data: {
  type: "supplis" | "manque";
  distance: number;
  objectCount: number;
  initialObjectCount: number;
}): Promise<void> => {
  const message =
    data.type === "supplis" ? "ALERTE: SUPPLIS !" : "ALERTE: MANQUE !";

  // Sauvegarder l'alerte dans SQLite
  await addAlert({
    type: "alerte",
    message: `${message}\nDistance: ${data.distance}cm\nObjets détectés: ${data.objectCount}\nObjets attendus: ${data.initialObjectCount}`,
    date: new Date().toISOString(),
    videoUri: null,
    screenshotUri: null,
    read: false
  });

  // Envoyer une notification
  await sendLocalNotification(
    message,
    `Distance: ${data.distance}cm\nObjets détectés: ${data.objectCount}\nObjets attendus: ${data.initialObjectCount}`,
    {
      type: "radar",
      severity: "high"
    }
  );
};

// Fonction pour marquer une alerte comme lue
export const markAlertAsRead = async (alertId: number): Promise<void> => {
  await markAlertAsReadDB(alertId);
};
