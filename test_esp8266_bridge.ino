#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

// Configuration WiFi
const char* ssid = "vivo S7t";
const char* password = "alibabao.s7t";
const char* deviceName = "ESP8266-Radar-Bridge-Test";

// Configuration réseau
IPAddress localIP(192, 168, 186, 241);
IPAddress gateway(192, 168, 186, 1);
IPAddress subnet(255, 255, 255, 0);

// Serveur Web
ESP8266WebServer server(80);

// Variables pour le test
int testAngle = 160;
int testDistance = 45;
int testObjectCount = 2;
bool alertActive = false;
String lastAlert = "";

void setup() {
  Serial.begin(115200);
  
  // Configuration WiFi
  WiFi.hostname(deviceName);
  WiFi.config(localIP, gateway, subnet);
  WiFi.begin(ssid, password);
  
  Serial.println("=== TEST ESP8266 BRIDGE ===");
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
  Serial.println("=== MODE TEST ===");
  Serial.println("1. Ouvrez http://192.168.186.241 dans votre navigateur");
  Serial.println("2. Testez les endpoints :");
  Serial.println("   - GET /status");
  Serial.println("   - GET /radar");
  Serial.println("   - GET /alert");
  Serial.println("   - GET /alerts");
  Serial.println("3. Utilisez l'application React Native");
}

void loop() {
  server.handleClient();
  
  // Simuler des données radar toutes les 2 secondes
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 2000) {
    lastUpdate = millis();
    
    // Simuler un balayage
    testAngle = (testAngle <= 20) ? 160 : testAngle - 10;
    testDistance = random(30, 100);
    
    // Simuler des alertes
    if (testObjectCount > 2) {
      if (!alertActive) {
        alertActive = true;
        lastAlert = "ALERTE: SUPPLIS !";
        Serial.println("ALERTE: SUPPLIS !");
      }
    } else if (testObjectCount < 2) {
      if (!alertActive) {
        alertActive = true;
        lastAlert = "ALERTE: MANQUE !";
        Serial.println("ALERTE: MANQUE !");
      }
    } else {
      alertActive = false;
    }
    
    // Afficher les données simulées
    Serial.printf("Données simulées: Angle=%d, Distance=%dcm, Objets=%d\n", 
                  testAngle, testDistance, testObjectCount);
  }
  
  delay(100);
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
    doc["mode"] = "test";
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Route pour obtenir les données radar actuelles
  server.on("/radar", HTTP_GET, []() {
    StaticJsonDocument<256> doc;
    doc["angle"] = testAngle;
    doc["distance"] = testDistance;
    doc["objectCount"] = testObjectCount;
    doc["timestamp"] = getCurrentTimestamp();
    doc["mode"] = "test";
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Route pour obtenir la dernière alerte
  server.on("/alert", HTTP_GET, []() {
    if (alertActive) {
      StaticJsonDocument<512> doc;
      doc["type"] = (testObjectCount > 2) ? "surplus" : "manque";
      doc["message"] = lastAlert;
      doc["timestamp"] = getCurrentTimestamp();
      doc["objectCount"] = testObjectCount;
      doc["expectedCount"] = 2;
      doc["active"] = true;
      doc["mode"] = "test";
      
      String response;
      serializeJson(doc, response);
      
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "application/json", response);
    } else {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(404, "application/json", "{\"error\":\"Aucune alerte active\"}");
    }
  });
  
  // Route pour obtenir toutes les alertes
  server.on("/alerts", HTTP_GET, []() {
    StaticJsonDocument<1024> doc;
    JsonArray alerts = doc.createNestedArray("alerts");
    
    if (alertActive) {
      JsonObject alert = alerts.createNestedObject();
      alert["type"] = (testObjectCount > 2) ? "surplus" : "manque";
      alert["message"] = lastAlert;
      alert["timestamp"] = getCurrentTimestamp();
      alert["objectCount"] = testObjectCount;
      alert["expectedCount"] = 2;
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
          testObjectCount = doc["expectedCount"];
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
    doc["expectedCount"] = testObjectCount;
    doc["detectionThreshold"] = 30;
    
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
  
  // Route racine avec informations de test
  server.on("/", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<title>ESP8266 Radar Bridge - TEST</title>";
    html += "<style>";
    html += "body { font-family: Arial, sans-serif; margin: 20px; }";
    html += ".status { padding: 10px; margin: 10px 0; border-radius: 5px; }";
    html += ".ok { background-color: #d4edda; color: #155724; }";
    html += ".alert { background-color: #f8d7da; color: #721c24; }";
    html += ".test { background-color: #fff3cd; color: #856404; }";
    html += "</style></head><body>";
    html += "<h1>ESP8266 Radar Bridge - MODE TEST</h1>";
    html += "<div class='status test'>";
    html += "<strong>MODE:</strong> TEST (Données simulées)<br>";
    html += "<strong>IP:</strong> " + WiFi.localIP().toString() + "<br>";
    html += "<strong>RSSI:</strong> " + String(WiFi.RSSI()) + " dBm<br>";
    html += "<strong>Uptime:</strong> " + String(millis() / 1000) + "s";
    html += "</div>";
    
    html += "<div class='status ok'>";
    html += "<strong>Données simulées:</strong><br>";
    html += "Angle: " + String(testAngle) + "°<br>";
    html += "Distance: " + String(testDistance) + " cm<br>";
    html += "Objets: " + String(testObjectCount) + "/2";
    html += "</div>";
    
    if (alertActive) {
      html += "<div class='status alert'>";
      html += "<strong>ALERTE ACTIVE:</strong><br>";
      html += "Message: " + lastAlert + "<br>";
      html += "Heure: " + getCurrentTimestamp();
      html += "</div>";
    }
    
    html += "<h2>Test de l'application React Native:</h2>";
    html += "<p>1. Lancez votre application React Native</p>";
    html += "<p>2. Vérifiez que l'adresse IP est: 192.168.186.241</p>";
    html += "<p>3. Les données devraient s'afficher en temps réel</p>";
    
    html += "<h2>Endpoints de test:</h2>";
    html += "<ul>";
    html += "<li><a href='/status' target='_blank'>GET /status</a></li>";
    html += "<li><a href='/radar' target='_blank'>GET /radar</a></li>";
    html += "<li><a href='/alert' target='_blank'>GET /alert</a></li>";
    html += "<li><a href='/alerts' target='_blank'>GET /alerts</a></li>";
    html += "<li><a href='/config' target='_blank'>GET /config</a></li>";
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