/** @format */
import * as SQLite from "expo-sqlite";

// Types
export type Alert = {
  id?: number;
  type: string;
  message: string;
  date: string;
  videoUri?: string | null;
  screenshotUri?: string | null;
  read?: boolean;
};

// DB init
const db = SQLite.openDatabaseSync("alerts.db");
const log = (label: string, data: any) =>
  console.log(`[SQLite] ${label}:`, data);

// Utils
const runQuery = <T = any[]>(query: string, params: any[] = []): Promise<T> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(query, params);
      resolve(result as unknown as T);
    } catch (e) {
      console.error("DB Query Error:", e);
      reject(e);
    }
  });
};

const runMutation = (query: string, params: any[] = []): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.runSync(query, params);
      resolve(result.changes ?? 0);
    } catch (e) {
      console.error("DB Mutation Error:", e);
      reject(e);
    }
  });
};

// Vérifier si la table existe
const tableExists = async (): Promise<boolean> => {
  const result = await runQuery(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='alerts';`
  );
  return result.length > 0;
};

// 🟢 Initialisation de la base
export const initDatabase = async () => {
  if (!(await tableExists())) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        videoUri TEXT,
        screenshotUri TEXT,
        read INTEGER DEFAULT 0
      );
    `);
    log("Table created", "alerts");
    await createDefaultAlerts();
  } else {
    try {
      db.getFirstSync("SELECT read FROM alerts LIMIT 1;");
    } catch {
      db.execSync("ALTER TABLE alerts ADD COLUMN read INTEGER DEFAULT 0;");
      log("Column added", "read");
    }
  }
};

// Ajouter une alerte
export const addAlert = async (alert: Alert): Promise<number> => {
  try {
    const result = db.runSync(
      `INSERT INTO alerts (type, message, date, videoUri, screenshotUri, read)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        alert.type,
        alert.message,
        alert.date,
        alert.videoUri ?? null,
        alert.screenshotUri ?? null,
        alert.read ? 1 : 0
      ]
    );
    log("Alert added", result.lastInsertRowId);
    return result.lastInsertRowId!;
  } catch (e) {
    console.error("Error adding alert:", e);
    throw e;
  }
};

// Récupérer toutes les alertes
export const getAlerts = async (): Promise<Alert[]> => {
  const rows = await runQuery<Alert[]>(
    "SELECT * FROM alerts ORDER BY date DESC;"
  );
  return rows.map((row) => ({ ...row, read: Boolean(row.read) }));
};

// 🟢 Récupérer une alerte par ID
export const getAlertById = async (id: number): Promise<Alert | null> => {
  const row = await db.getFirstAsync<Alert>(
    `SELECT * FROM alerts WHERE id = ?;`,
    [id]
  );
  return row ? { ...row, read: Boolean(row.read) } : null;
};

// 🟡 Supprimer toutes les alertes
export const deleteAllAlerts = async (): Promise<boolean> => {
  await runMutation("DELETE FROM alerts;");
  log("All alerts deleted", "");
  return true;
};

// 🔴 Supprimer une alerte par ID
export const deleteAlertById = async (id: number): Promise<boolean> => {
  const result = await db.runAsync(`DELETE FROM alerts WHERE id = ?;`, [id]);
  log("Alert deleted", result.changes);
  return result.changes > 0;
};

// 🟢 Marquer une alerte comme lue
export const markAlertAsRead = async (id: number): Promise<boolean> => {
  const result = await db.runAsync(`UPDATE alerts SET read = 1 WHERE id = ?;`, [
    id
  ]);
  log("Alert marked as read", result.changes);
  return result.changes > 0;
};

// 🟢 Créer des alertes par défaut
export const createDefaultAlerts = async (): Promise<void> => {
  const now = Date.now();
  const defaultAlerts: Alert[] = [
    {
      type: "présence",
      message: "Détection de mouvement dans l'enclos",
      date: new Date(now - 30 * 60 * 1000).toISOString(),
      read: false
    },
    {
      type: "caméra",
      message: "Perte de connexion avec la caméra de l'enclos",
      date: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      type: "alerte",
      message: "Il manque un boeuf dans l'enclos",
      date: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      type: "présence",
      message: "Mouvement suspect détecté près de la barrière principale",
      date: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      read: false
    }
  ];

  for (const alert of defaultAlerts) {
    await addAlert(alert);
  }
  log("Default alerts created", defaultAlerts.length);
};
