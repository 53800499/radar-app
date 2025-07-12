#include <Servo.h>
#include <Ucglib.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

// Définition des broches GPIO
#define trigPin 12  // correspond à D6
#define echoPin 0   // correspond à D5
#define ServoPin 16 // correspond à D4

#define TFT_CD   2  // GPIO4 (D2)
#define TFT_CS   15 // GPIO5 (D1)
#define TFT_RST  4  // GPIO16 (D0) ou U8G_PIN_NONE si non câblé

// Configuration WiFi
const char* ssid = "TECNO SPARK 10C";
const char* password = "simple1234";
const char* deviceName = "ESP8266-Radar-Simple";

// Configuration réseau
IPAddress localIP(10, 72, 98, 101);   // IP de l’ESP8266 (choisis un nombre libre)
IPAddress gateway(10, 72, 98, 80);    // Passerelle = celle de ton PC (ipconfig)
IPAddress subnet(255, 255, 255, 0);   // Masque

// Initialisation des composants
Servo baseServo;
Ucglib_ILI9341_18x240x320_HWSPI ucg(TFT_CD, TFT_CS, TFT_RST);
ESP8266WebServer server(81);

// Dimensions écran
int Ymax = 240;
int Xmax = 320;
int Xcent = Xmax / 2;
int base = 228;
int scanline = 215;

// --- Variables pour le comptage et l'alerte ---
int objectCount = 0;                // Nombre d'objets détectés lors du balayage
int initialObjectCount = 2;         // Valeur initiale attendue (modifiable)
bool objectDetected = false;        // Flag pour éviter le double comptage
const int detectionThreshold = 30;  // Distance seuil pour détection (en cm)

// Variables pour l'API
int currentAngle = 90;
int currentDistance = 0;
bool alertActive = false;
String lastAlertMessage = "";
String lastAlertType = "";

// Variables pour le dédoublonnage des alertes sur l'ESP
unsigned long lastAlertTriggerTimestamp = 0;
const unsigned long ALERT_DEBOUNCE_DURATION = 60000; // 1 minute en millisecondes

// Timing pour le serveur web
unsigned long lastWebUpdate = 0;
const unsigned long WEB_UPDATE_INTERVAL = 100; // 100ms

void setup() {
  Serial.begin(115200);
  
  // Configuration WiFi en premier
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

  // Initialisation de l'écran
  ucg.begin(UCG_FONT_MODE_SOLID);
  ucg.setRotate270();

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  baseServo.attach(ServoPin);

  // Écran de bienvenue
  ucg.setFontMode(UCG_FONT_MODE_TRANSPARENT);
  ucg.setColor(0, 0, 100, 0);
  ucg.setColor(1, 0, 100, 0);
  ucg.setColor(2, 20, 20, 20);
  ucg.setColor(3, 20, 20, 20);
  ucg.drawGradientBox(0, 0, 320, 240);
  ucg.setPrintDir(0);
  ucg.setColor(0, 5, 0);
  ucg.setPrintPos(77, 102);
  ucg.setFont(ucg_font_logisoso32_tf);
  ucg.print("Mini Radar");
  ucg.setColor(0, 255, 0);
  ucg.setPrintPos(75, 100);
  ucg.print("Mini Radar");
  ucg.setFont(ucg_font_helvB12_tf);
  ucg.setColor(20, 255, 20);
  ucg.setPrintPos(110, 195);
  ucg.print("Loading...");
  baseServo.write(90);

  for (int x = 20; x < 161; x++) {
    baseServo.write(x);
    delay(5); // Vitesse du servo augmentée (était 8)
  }

  ucg.print("OK!");
  delay(500);
  ucg.clearScreen();
  ucg.setFontMode(UCG_FONT_MODE_SOLID);
  ucg.setFont(ucg_font_orgv01_hr);
}

int calculateDistance() {
  long duration;
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH, 30000);  // Timeout 30ms
  return duration * 0.034 / 2;
}

int smoothDistance() {
  int sum = 0;
  int validCount = 0;
  for (int i = 0; i < 5; i++) { // 5 mesures pour plus de stabilité
    int d = calculateDistance();
    if (d > 0) {
      sum += d;
      validCount++;
    }
    delay(2);
  }
  if (validCount == 0) return 0;
  return sum / validCount;
}

void fix_font() {
  ucg.setColor(0, 220, 0);
  ucg.setPrintPos(152, 14); ucg.print("2.05");
  ucg.setPrintPos(152, 67); ucg.print("1.75");
  ucg.setPrintPos(152, 102); ucg.print("1.35");
  ucg.setPrintPos(152, 133); ucg.print("1.05");
  ucg.setPrintPos(150, 167); ucg.print("0.75");
  ucg.setPrintPos(150, 202); ucg.print("0.35");
}

void fix() {
  ucg.setColor(0, 160, 0);
  ucg.drawDisc(Xcent, base + 1, 5, UCG_DRAW_ALL);
  int radii[] = {211, 173, 140, 108, 75, 40};
  for (int r : radii) {
    ucg.drawCircle(Xcent, base + 1, r, UCG_DRAW_UPPER_LEFT);
    ucg.drawCircle(Xcent, base + 1, r, UCG_DRAW_UPPER_RIGHT);
  }
  ucg.drawLine(0, base + 1, Xmax, base + 1);

  ucg.setColor(0, 200, 0);
  for (int i = 30; i < 150; i += 2) {
    float angle = radians(i);
    if (i % 10 == 0)
      ucg.drawLine(Xcent + 210 * cos(angle), base - 210 * sin(angle), Xcent + 200 * cos(angle), base - 200 * sin(angle));
    else
      ucg.drawLine(Xcent + 209 * cos(angle), base - 209 * sin(angle), Xcent + 205 * cos(angle), base - 205 * sin(angle));
  }

  ucg.setColor(0, 200, 0);
  ucg.drawLine(0, 0, 0, 28);
  for (int i = 0; i < 5; i++) {
    ucg.setColor(0, random(200) + 50, 0);
    ucg.drawBox(2, i * 6, random(40) + 5, 5);
  }

  ucg.setColor(0, 180, 0);
  ucg.drawFrame(290, 0, 30, 30);
  ucg.setColor(0, 220, 0);
  ucg.drawBox(306, 2, 12, 12);
  ucg.drawBox(306, 16, 12, 12);
  ucg.drawBox(292, 16, 12, 12);
  ucg.setColor(0, 100, 0);
  ucg.drawBox(292, 2, 12, 12);
}

void showAlert(const char* message) {
  ucg.setColor(255, 0, 0);
  ucg.setFont(ucg_font_logisoso22_tf);
  ucg.setPrintPos(40, 120);
  ucg.print(message);
  delay(1500);
  ucg.setFont(ucg_font_orgv01_hr);
}

void triggerAlert(const char* message, const char* type) {
  unsigned long currentTime = millis();
  
  // Si le message est différent OU si plus d'une minute s'est écoulée
  if (String(message) != lastAlertMessage || (currentTime - lastAlertTriggerTimestamp > ALERT_DEBOUNCE_DURATION)) {
    showAlert(message);
    alertActive = true;
    lastAlertMessage = message;
    lastAlertType = type;
    lastAlertTriggerTimestamp = currentTime; // Mettre à jour le timestamp de la dernière alerte valide
  }
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

void loop() {
  // Gérer les requêtes web à chaque itération pour éviter le blocage
  server.handleClient();
  
  int distance;
  objectCount = 0;
  bool inObject = false;

  fix();
  fix_font();

  // Balayage de droite à gauche
  for (int x = 160; x >= 20; x -= 1) {
    server.handleClient(); // Gérer les requêtes pendant le balayage
    baseServo.write(x);
    int f = x - 4;
    ucg.setColor(0, 255, 0);
    ucg.drawLine(Xcent, base, scanline * cos(radians(f)) + Xcent, base - scanline * sin(radians(f)));
    f++; ucg.setColor(0, 128, 0);
    ucg.drawLine(Xcent, base, scanline * cos(radians(f)) + Xcent, base - scanline * sin(radians(f)));
    f++; ucg.setColor(0, 0, 0);
    ucg.drawLine(Xcent, base, scanline * cos(radians(f)) + Xcent, base - scanline * sin(radians(f)));

    distance = smoothDistance();
    ucg.setColor(255, 0, 0);
    ucg.drawDisc(distance * cos(radians(x)) + Xcent, -distance * sin(radians(x)) + base, 1, UCG_DRAW_ALL);

    // Mettre à jour les données pour l'API
    currentAngle = x;
    currentDistance = distance;

    // Comptage d'objet par front montant
    if (!inObject && distance > 0 && distance < detectionThreshold) {
      objectCount++;
      inObject = true;
    } else if (inObject && (distance >= detectionThreshold || distance <= 0)) {
      inObject = false;
    }

    if (x > 70 && x < 110) fix_font();

    ucg.setColor(0, 200, 0);
    ucg.setPrintPos(0, 238); ucg.print("DEG: ");
    ucg.setPrintPos(24, 238); ucg.print(x); ucg.print("  ");
    ucg.setPrintPos(120, 238); ucg.print("OBJ: "); ucg.print(objectCount);
    ucg.setPrintPos(200, 238); ucg.print("REF: "); ucg.print(initialObjectCount);
    ucg.setPrintPos(260, 238); ucg.print(distance); ucg.print("cm  ");
    delay(5); // Vitesse du servo augmentée (était 8)
  }

  // Vérification et affichage de l'alerte après balayage
  if (objectCount > initialObjectCount) {
    triggerAlert("ALERTE: INTRUSION !", "intrusion dans le système");
  } 
  /* else if (objectCount < initialObjectCount) {
    triggerAlert("ALERTE: MANQUE !", "manque");
  } */ 
  else {
    alertActive = false;
    lastAlertMessage = ""; // Réinitialiser si tout est normal
  }

  ucg.clearScreen();
  fix();
  fix_font();

  objectCount = 0;
  inObject = false;

  // Balayage de gauche à droite
  for (int x = 20; x < 161; x += 1) {
    server.handleClient(); // Gérer les requêtes pendant le balayage
    baseServo.write(x);
    int f = x + 4;
    ucg.setColor(0, 255, 0);
    ucg.drawLine(Xcent, base, scanline * cos(radians(f)) + Xcent, base - scanline * sin(radians(f)));
    f--; ucg.setColor(0, 128, 0);
    ucg.drawLine(Xcent, base, scanline * cos(radians(f)) + Xcent, base - scanline * sin(radians(f)));
    f--; ucg.setColor(0, 0, 0);
    ucg.drawLine(Xcent, base, scanline * cos(radians(f)) + Xcent, base - scanline * sin(radians(f)));

    distance = smoothDistance();
    ucg.setColor(255, 0, 0);
    ucg.drawDisc(distance * cos(radians(x)) + Xcent, -distance * sin(radians(x)) + base, 1, UCG_DRAW_ALL);

    // Mettre à jour les données pour l'API
    currentAngle = x;
    currentDistance = distance;

    // Comptage d'objet par front montant
    if (!inObject && distance > 0 && distance < detectionThreshold) {
      objectCount++;
      inObject = true;
    } else if (inObject && (distance >= detectionThreshold || distance <= 0)) {
      inObject = false;
    }

    if (x > 70 && x < 110) fix_font();

    ucg.setColor(0, 200, 0);
    ucg.setPrintPos(0, 238); ucg.print("DEG: ");
    ucg.setPrintPos(24, 238); ucg.print(x); ucg.print("  ");
    ucg.setPrintPos(120, 238); ucg.print("OBJ: "); ucg.print(objectCount);
    ucg.setPrintPos(200, 238); ucg.print("REF: "); ucg.print(initialObjectCount);
    ucg.setPrintPos(260, 238); ucg.print(distance); ucg.print("cm   ");
    delay(5); // Vitesse du servo augmentée (était 8)
  }

  // Vérification et affichage de l'alerte après balayage
  if (objectCount > initialObjectCount) {
    triggerAlert("ALERTE: INTRUSION !", "intrusion dans le système");
  } /* else if (objectCount < initialObjectCount) {
    triggerAlert("ALERTE: MANQUE !", "manque");
  } */ else {
    alertActive = false;
    lastAlertMessage = ""; // Réinitialiser si tout est normal
  }

  ucg.clearScreen();
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
    doc["angle"] = currentAngle;
    doc["distance"] = currentDistance;
    doc["objectCount"] = objectCount;
    doc["timestamp"] = getCurrentTimestamp();
    
    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });
  
  // Route pour obtenir la dernière alerte
  server.on("/alert", HTTP_GET, []() {
    if (alertActive) {
      StaticJsonDocument<512> doc;
      doc["type"] = lastAlertType;
      doc["message"] = lastAlertMessage;
      doc["timestamp"] = getCurrentTimestamp();
      doc["objectCount"] = objectCount;
      doc["expectedCount"] = initialObjectCount;
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
  
  // Route pour obtenir toutes les alertes
  server.on("/alerts", HTTP_GET, []() {
    StaticJsonDocument<1024> doc;
    JsonArray alerts = doc.createNestedArray("alerts");
    
    if (alertActive) {
      JsonObject alert = alerts.createNestedObject();
      alert["type"] = lastAlertType;
      alert["message"] = lastAlertMessage;
      alert["timestamp"] = getCurrentTimestamp();
      alert["objectCount"] = objectCount;
      alert["expectedCount"] = initialObjectCount;
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
          initialObjectCount = doc["expectedCount"];
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
    doc["expectedCount"] = initialObjectCount;
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
    html += "<title>ESP8266 Radar Simple</title>";
    html += "<style>";
    html += "body { font-family: Arial, sans-serif; margin: 20px; }";
    html += ".status { padding: 10px; margin: 10px 0; border-radius: 5px; }";
    html += ".ok { background-color: #d4edda; color: #155724; }";
    html += ".alert { background-color: #f8d7da; color: #721c24; }";
    html += "</style></head><body>";
    html += "<h1>ESP8266 Radar Simple</h1>";
    html += "<div class='status ok'>";
    html += "<strong>Statut:</strong> Connecté<br>";
    html += "<strong>IP:</strong> " + WiFi.localIP().toString() + "<br>";
    html += "<strong>RSSI:</strong> " + String(WiFi.RSSI()) + " dBm<br>";
    html += "<strong>Uptime:</strong> " + String(millis() / 1000) + "s";
    html += "</div>";
    
    if (alertActive) {
      html += "<div class='status alert'>";
      html += "<strong>ALERTE ACTIVE:</strong><br>";
      html += "Type: " + lastAlertType + "<br>";
      html += "Message: " + lastAlertMessage + "<br>";
      html += "Objets: " + String(objectCount) + "/" + String(initialObjectCount) + "<br>";
      html += "Heure: " + getCurrentTimestamp();
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