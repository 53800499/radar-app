#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

// Configuration WiFi
const char* ssid = "vivo S7t";
const char* password = "alibabao.s7t";
const char* deviceName = "ESP8266-Radar-Test";

// Configuration réseau
IPAddress localIP(192, 168, 186, 240);
IPAddress gateway(192, 168, 186, 1);
IPAddress subnet(255, 255, 255, 0);

// Serveur Web
ESP8266WebServer server(80);

// Variables de test
int testAngle = 90;
int testDistance = 50;
int testObjectCount = 2;
bool alertActive = false;

void setup() {
  Serial.begin(115200);
  
  // Configuration WiFi
  WiFi.hostname(deviceName);
  WiFi.config(localIP, gateway, subnet);
  WiFi.begin(ssid, password);
  
  Serial.println("=== TEST ESP8266 CONNECTIVITE ===");
  Serial.println("Connexion au WiFi...");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connecté avec succès !");
    Serial.print("Adresse IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("RSSI: ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println("");
    Serial.println("ÉCHEC de connexion WiFi !");
    Serial.println("Vérifiez :");
    Serial.println("1. Le nom du réseau WiFi");
    Serial.println("2. Le mot de passe");
    Serial.println("3. La configuration IP statique");
  }
  
  // Configuration du serveur Web
  setupWebServer();
  server.begin();
  
  Serial.println("Serveur Web démarré sur le port 80");
  Serial.println("Testez avec : http://192.168.186.240/status");
}

void loop() {
  server.handleClient();
  
  // Simuler des changements de données
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 5000) {
    lastUpdate = millis();
    testAngle = (testAngle >= 160) ? 20 : testAngle + 10;
    testDistance = random(30, 100);
    Serial.printf("Données simulées: Angle=%d, Distance=%d, Objets=%d\n", 
                  testAngle, testDistance, testObjectCount);
  }
  
  delay(100);
}

void setupWebServer() {
  // Route de test simple
  server.on("/test", HTTP_GET, []() {
    server.send(200, "text/plain", "ESP8266 connecté !");
  });
  
  // Route pour obtenir le statut
  server.on("/status", HTTP_GET, []() {
    StaticJsonDocument<512> doc;
    doc["status"] = "ok";
    doc["ip"] = WiFi.localIP().toString();
    doc["ssid"] = WiFi.SSID();
    doc["rssi"] = WiFi.RSSI();
    doc["uptime"] = millis();
    doc["mode"] = "test";
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Route pour obtenir les données radar
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
  
  // Route racine avec informations de test
  server.on("/", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<title>ESP8266 Test</title>";
    html += "<style>";
    html += "body { font-family: Arial, sans-serif; margin: 20px; }";
    html += ".status { padding: 10px; margin: 10px 0; border-radius: 5px; }";
    html += ".ok { background-color: #d4edda; color: #155724; }";
    html += ".error { background-color: #f8d7da; color: #721c24; }";
    html += "</style></head><body>";
    html += "<h1>ESP8266 Test de Connectivité</h1>";
    
    if (WiFi.status() == WL_CONNECTED) {
      html += "<div class='status ok'>";
      html += "<strong>STATUT:</strong> CONNECTÉ<br>";
      html += "<strong>IP:</strong> " + WiFi.localIP().toString() + "<br>";
      html += "<strong>SSID:</strong> " + WiFi.SSID() + "<br>";
      html += "<strong>RSSI:</strong> " + String(WiFi.RSSI()) + " dBm<br>";
      html += "<strong>Uptime:</strong> " + String(millis() / 1000) + "s";
      html += "</div>";
    } else {
      html += "<div class='status error'>";
      html += "<strong>STATUT:</strong> DÉCONNECTÉ<br>";
      html += "<strong>Code d'erreur:</strong> " + String(WiFi.status());
      html += "</div>";
    }
    
    html += "<h2>Tests disponibles:</h2>";
    html += "<ul>";
    html += "<li><a href='/test'>GET /test</a> - Test simple</li>";
    html += "<li><a href='/status'>GET /status</a> - Statut complet</li>";
    html += "<li><a href='/radar'>GET /radar</a> - Données radar</li>";
    html += "</ul>";
    html += "</body></html>";
    
    server.send(200, "text/html", html);
  });
  
  // Gestion des erreurs
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "application/json", "{\"error\":\"Route non trouvée\"}");
  });
}

String getCurrentTimestamp() {
  unsigned long currentTime = millis();
  unsigned long seconds = currentTime / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  char timestamp[20];
  sprintf(timestamp, "%02lu:%02lu:%02lu", hours, minutes % 60, seconds % 60);
  return String(timestamp);
} 