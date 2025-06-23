#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>

// Configuration WiFi
const char* ssid = "vivo S7t";
const char* password = "alibabao.s7t";
const char* deviceName = "ESP8266-Radar-Bridge";

// Configuration réseau
IPAddress localIP(192, 168, 46, 241);
IPAddress gateway(192, 168, 46, 1);
IPAddress subnet(255, 255, 255, 0);

// Serveur Web
ESP8266WebServer server(80);

// Variables pour le radar
struct RadarData {
  int angle;
  int distance;
  int objectCount;
  bool isValid;
};

struct Alert {
  String type;
  String message;
  String timestamp;
  int objectCount;
  int expectedCount;
};

// Variables globales
RadarData currentData;
Alert lastAlert;
bool alertActive = false;
int expectedObjectCount = 2; // Valeur par défaut
int detectionThreshold = 30; // Distance seuil en cm

// Buffer pour les données Serial
String serialBuffer = "";

void setup() {
  Serial.begin(115200);
  
  // Configuration WiFi
  WiFi.hostname(deviceName);
  WiFi.config(localIP, gateway, subnet);
  WiFi.begin(ssid, password);
  
  Serial.println("Connexion au WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connecté");
  Serial.print("Adresse IP: ");
  Serial.println(WiFi.localIP());
  
  // Configuration du serveur Web
  setupWebServer();
  server.begin();
  
  Serial.println("Serveur Web démarré");
  Serial.println("En attente des données du radar...");
}

void loop() {
  server.handleClient();
  
  // Lire les données Serial du radar
  if (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      processSerialData(serialBuffer);
      serialBuffer = "";
    } else {
      serialBuffer += c;
    }
  }
  
  delay(10);
}

// Traiter les données Serial du radar
void processSerialData(String data) {
  // Format attendu: "angle,distance,objectCount."
  data.trim();
  if (data.endsWith(".")) {
    data = data.substring(0, data.length() - 1); // Enlever le point final
  }
  
  int comma1 = data.indexOf(',');
  int comma2 = data.indexOf(',', comma1 + 1);
  
  if (comma1 != -1 && comma2 != -1) {
    int angle = data.substring(0, comma1).toInt();
    int distance = data.substring(comma1 + 1, comma2).toInt();
    int objectCount = data.substring(comma2 + 1).toInt();
    
    // Mettre à jour les données courantes
    currentData.angle = angle;
    currentData.distance = distance;
    currentData.objectCount = objectCount;
    currentData.isValid = true;
    
    // Vérifier les alertes
    checkForAlerts(objectCount);
    
    // Debug
    Serial.printf("Données reçues: Angle=%d, Distance=%dcm, Objets=%d\n", 
                  angle, distance, objectCount);
  }
}

// Vérifier s'il y a une alerte
void checkForAlerts(int objectCount) {
  if (objectCount > expectedObjectCount) {
    if (!alertActive || lastAlert.type != "surplus") {
      createAlert("surplus", "ALERTE: SUPPLIS !", objectCount);
    }
  } else if (objectCount < expectedObjectCount) {
    if (!alertActive || lastAlert.type != "manque") {
      createAlert("manque", "ALERTE: MANQUE !", objectCount);
    }
  } else {
    // Pas d'alerte
    alertActive = false;
  }
}

// Créer une alerte
void createAlert(String type, String message, int objectCount) {
  lastAlert.type = type;
  lastAlert.message = message;
  lastAlert.timestamp = getCurrentTimestamp();
  lastAlert.objectCount = objectCount;
  lastAlert.expectedCount = expectedObjectCount;
  alertActive = true;
  
  Serial.printf("ALERTE: %s (Objets: %d/%d)\n", 
                message.c_str(), objectCount, expectedObjectCount);
}

// Obtenir le timestamp actuel
String getCurrentTimestamp() {
  unsigned long currentTime = millis();
  unsigned long seconds = currentTime / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  char timestamp[20];
  sprintf(timestamp, "%02lu:%02lu:%02lu", hours, minutes % 60, seconds % 60);
  return String(timestamp);
}

// Configuration du serveur Web
void setupWebServer() {
  // Route pour obtenir le statut
  server.on("/status", HTTP_GET, []() {
    StaticJsonDocument<512> doc;
    doc["status"] = "ok";
    doc["ip"] = WiFi.localIP().toString();
    doc["ssid"] = WiFi.SSID();
    doc["rssi"] = WiFi.RSSI();
    doc["uptime"] = millis();
    doc["alertActive"] = alertActive;
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Route pour obtenir les données radar actuelles
  server.on("/radar", HTTP_GET, []() {
    StaticJsonDocument<256> doc;
    
    if (currentData.isValid) {
      doc["angle"] = currentData.angle;
      doc["distance"] = currentData.distance;
      doc["objectCount"] = currentData.objectCount;
      doc["timestamp"] = getCurrentTimestamp();
    } else {
      doc["error"] = "Aucune donnée disponible";
    }
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Route pour obtenir la dernière alerte
  server.on("/alert", HTTP_GET, []() {
    if (alertActive) {
      StaticJsonDocument<512> doc;
      doc["type"] = lastAlert.type;
      doc["message"] = lastAlert.message;
      doc["timestamp"] = lastAlert.timestamp;
      doc["objectCount"] = lastAlert.objectCount;
      doc["expectedCount"] = lastAlert.expectedCount;
      doc["active"] = true;
      
      String response;
      serializeJson(doc, response);
      
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "application/json", response);
    } else {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(404, "application/json", "{\"error\":\"Aucune alerte active\"}");
    }
  });
  
  // Route pour obtenir toutes les alertes (historique)
  server.on("/alerts", HTTP_GET, []() {
    StaticJsonDocument<1024> doc;
    JsonArray alerts = doc.createNestedArray("alerts");
    
    if (alertActive) {
      JsonObject alert = alerts.createNestedObject();
      alert["type"] = lastAlert.type;
      alert["message"] = lastAlert.message;
      alert["timestamp"] = lastAlert.timestamp;
      alert["objectCount"] = lastAlert.objectCount;
      alert["expectedCount"] = lastAlert.expectedCount;
    }
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Route pour configurer les paramètres
  server.on("/config", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, server.arg("plain"));
      
      if (!error) {
        if (doc.containsKey("expectedCount")) {
          expectedObjectCount = doc["expectedCount"];
        }
        if (doc.containsKey("detectionThreshold")) {
          detectionThreshold = doc["detectionThreshold"];
        }
        
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(200, "application/json", "{\"status\":\"ok\"}");
      } else {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(400, "application/json", "{\"error\":\"JSON invalide\"}");
      }
    } else {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(400, "application/json", "{\"error\":\"Données manquantes\"}");
    }
  });
  
  // Route pour obtenir la configuration
  server.on("/config", HTTP_GET, []() {
    StaticJsonDocument<256> doc;
    doc["expectedCount"] = expectedObjectCount;
    doc["detectionThreshold"] = detectionThreshold;
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Route pour réinitialiser les alertes
  server.on("/reset", HTTP_POST, []() {
    alertActive = false;
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  });
  
  // Route racine avec informations
  server.on("/", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<title>ESP8266 Radar Bridge</title>";
    html += "<style>";
    html += "body { font-family: Arial, sans-serif; margin: 20px; }";
    html += ".status { padding: 10px; margin: 10px 0; border-radius: 5px; }";
    html += ".ok { background-color: #d4edda; color: #155724; }";
    html += ".alert { background-color: #f8d7da; color: #721c24; }";
    html += "</style></head><body>";
    html += "<h1>ESP8266 Radar Bridge</h1>";
    html += "<div class='status ok'>";
    html += "<strong>Statut:</strong> Connecté<br>";
    html += "<strong>IP:</strong> " + WiFi.localIP().toString() + "<br>";
    html += "<strong>RSSI:</strong> " + String(WiFi.RSSI()) + " dBm<br>";
    html += "<strong>Uptime:</strong> " + String(millis() / 1000) + "s";
    html += "</div>";
    
    if (alertActive) {
      html += "<div class='status alert'>";
      html += "<strong>ALERTE ACTIVE:</strong><br>";
      html += "Type: " + lastAlert.type + "<br>";
      html += "Message: " + lastAlert.message + "<br>";
      html += "Objets: " + String(lastAlert.objectCount) + "/" + String(lastAlert.expectedCount) + "<br>";
      html += "Heure: " + lastAlert.timestamp;
      html += "</div>";
    }
    
    html += "<h2>Endpoints disponibles:</h2>";
    html += "<ul>";
    html += "<li><strong>GET /status</strong> - Statut du système</li>";
    html += "<li><strong>GET /radar</strong> - Données radar actuelles</li>";
    html += "<li><strong>GET /alert</strong> - Dernière alerte</li>";
    html += "<li><strong>GET /alerts</strong> - Historique des alertes</li>";
    html += "<li><strong>GET /config</strong> - Configuration actuelle</li>";
    html += "<li><strong>POST /config</strong> - Modifier la configuration</li>";
    html += "<li><strong>POST /reset</strong> - Réinitialiser les alertes</li>";
    html += "</ul>";
    html += "</body></html>";
    
    server.send(200, "text/html", html);
  });
  
  // Gestion des erreurs CORS
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "application/json", "{\"error\":\"Route non trouvée\"}");
  });
} 