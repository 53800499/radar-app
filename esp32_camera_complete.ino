#include "esp_camera.h"
#include <WiFi.h>
#include <EEPROM.h>
#include <DNSServer.h>
#include <WebServer.h>

// Configuration de l'EEPROM
#define EEPROM_SIZE 512
#define WIFI_SSID_ADDR 0
#define WIFI_PASS_ADDR 32
#define IP_ADDR_ADDR 64
#define IP_GATEWAY_ADDR 96
#define IP_SUBNET_ADDR 128

// Configuration de la caméra
#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

// Configuration réseau par défaut
const char* default_ssid = "vivo S7t";
const char* default_password = "alibabao.s7t";
IPAddress default_ip(192, 168, 46, 240);
IPAddress default_gateway(192, 168, 46, 1);
IPAddress default_subnet(255, 255, 255, 0);

// Variables globales
WebServer server(81);
DNSServer dnsServer;
bool isConfigured = false;

// Structure pour les paramètres WiFi
struct WiFiConfig {
  char ssid[32];
  char password[64];
  IPAddress ip;
  IPAddress gateway;
  IPAddress subnet;
};

WiFiConfig wifiConfig;

// Fonction pour sauvegarder la configuration
void saveConfig() {
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.put(WIFI_SSID_ADDR, wifiConfig.ssid);
  EEPROM.put(WIFI_PASS_ADDR, wifiConfig.password);
  EEPROM.put(IP_ADDR_ADDR, wifiConfig.ip);
  EEPROM.put(IP_GATEWAY_ADDR, wifiConfig.gateway);
  EEPROM.put(IP_SUBNET_ADDR, wifiConfig.subnet);
  EEPROM.commit();
  EEPROM.end();
}

// Fonction pour charger la configuration
void loadConfig() {
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.get(WIFI_SSID_ADDR, wifiConfig.ssid);
  EEPROM.get(WIFI_PASS_ADDR, wifiConfig.password);
  EEPROM.get(IP_ADDR_ADDR, wifiConfig.ip);
  EEPROM.get(IP_GATEWAY_ADDR, wifiConfig.gateway);
  EEPROM.get(IP_SUBNET_ADDR, wifiConfig.subnet);
  EEPROM.end();
}

// Configuration de la caméra
void setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size = FRAMESIZE_UXGA;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  if (psramFound()) {
    config.jpeg_quality = 10;
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_LATEST;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  sensor_t *s = esp_camera_sensor_get();
  s->set_framesize(s, FRAMESIZE_QVGA);
}

// Page d'accueil avec flux vidéo
void handleRoot() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #000; }";
  html += ".container { max-width: 800px; margin: 0 auto; }";
  html += "h1 { color: #fff; text-align: center; }";
  html += "img { width: 100%; height: auto; border-radius: 10px; }";
  html += ".status { color: #fff; text-align: center; margin: 10px 0; }";
  html += "</style></head><body>";
  html += "<div class='container'>";
  html += "<h1>ESP32-CAM Surveillance</h1>";
  html += "<div class='status'>Flux vidéo en direct</div>";
  html += "<img src='/stream' alt='Flux vidéo'>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

// Flux vidéo MJPEG
void handleStream() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n";
  server.sendContent(response);

  while (true) {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      break;
    }
    
    response = "--frame\r\n";
    response += "Content-Type: image/jpeg\r\n\r\n";
    server.sendContent(response);
    
    uint8_t *fbBuf = fb->buf;
    size_t fbLen = fb->len;
    for (size_t n = 0; n < fbLen; n = n + 1024) {
      if (n + 1024 < fbLen) {
        server.sendContent((char*)(fbBuf + n), 1024);
      } else if (fbLen % 1024 > 0) {
        size_t remainder = fbLen % 1024;
        server.sendContent((char*)(fbBuf + n), remainder);
      }
    }
    server.sendContent("\r\n");
    esp_camera_fb_return(fb);
    
    // Délai pour contrôler le framerate
    delay(100);
  }
}

// Capture d'image unique
void handleCapture() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }
  
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Content-Disposition", "inline; filename=capture.jpg");
  server.sendHeader("Content-Length", String(fb->len));
  server.send(200, "image/jpeg", "");
  
  // Envoyer les données de l'image
  server.sendContent((char*)fb->buf, fb->len);
  
  esp_camera_fb_return(fb);
}

// Statut de la caméra
void handleStatus() {
  String json = "{";
  json += "\"status\":\"ok\",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"ssid\":\"" + WiFi.SSID() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"uptime\":" + String(millis());
  json += "}";
  server.send(200, "application/json", json);
}

// Configuration du serveur de caméra
void startMyCameraServer() {
  server.on("/", handleRoot);
  server.on("/stream", handleStream);
  server.on("/capture", handleCapture);
  server.on("/status", handleStatus);
  
  server.begin();
  Serial.println("Serveur de caméra démarré");
  Serial.print("Adresse: http://");
  Serial.println(WiFi.localIP());
}

// Page de configuration WiFi
void handleConfig() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }";
  html += ".container { max-width: 400px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; }";
  html += "h1 { text-align: center; color: #333; }";
  html += "input, button { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }";
  html += "button { background: #007bff; color: #fff; border: none; cursor: pointer; }";
  html += "button:hover { background: #0056b3; }";
  html += "</style></head><body>";
  html += "<div class='container'>";
  html += "<h1>Configuration WiFi</h1>";
  html += "<form method='post' action='/save'>";
  html += "<input type='text' name='ssid' placeholder='Nom du réseau WiFi' required>";
  html += "<input type='password' name='password' placeholder='Mot de passe WiFi' required>";
  html += "<input type='text' name='ip' placeholder='Adresse IP (ex: 192.168.1.100)' required>";
  html += "<input type='text' name='gateway' placeholder='Passerelle (ex: 192.168.1.1)' required>";
  html += "<input type='text' name='subnet' placeholder='Masque (ex: 255.255.255.0)' required>";
  html += "<button type='submit'>Sauvegarder</button>";
  html += "</form></div></body></html>";
  server.send(200, "text/html", html);
}

// Sauvegarde de la configuration
void handleSave() {
  if (server.hasArg("ssid")) {
    strcpy(wifiConfig.ssid, server.arg("ssid").c_str());
    strcpy(wifiConfig.password, server.arg("password").c_str());
    wifiConfig.ip.fromString(server.arg("ip"));
    wifiConfig.gateway.fromString(server.arg("gateway"));
    wifiConfig.subnet.fromString(server.arg("subnet"));
    
    saveConfig();
    
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<style>";
    html += "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; text-align: center; }";
    html += ".container { max-width: 400px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; }";
    html += "</style></head><body>";
    html += "<div class='container'>";
    html += "<h1>Configuration sauvegardée</h1>";
    html += "<p>Redémarrage en cours...</p>";
    html += "</div></body></html>";
    server.send(200, "text/html", html);
    
    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "Paramètres manquants");
  }
}

// Configuration du serveur de configuration
void setupConfigServer() {
  server.on("/", handleConfig);
  server.on("/save", HTTP_POST, handleSave);
  
  server.begin();
  Serial.println("Serveur de configuration démarré");
  Serial.print("Adresse: http://");
  Serial.println(WiFi.softAPIP());
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  
  // Charger la configuration
  loadConfig();
  
  // Configurer la caméra
  setupCamera();
  
  // Configurer le WiFi
  WiFi.mode(WIFI_STA);
  WiFi.config(wifiConfig.ip, wifiConfig.gateway, wifiConfig.subnet);
  WiFi.begin(wifiConfig.ssid, wifiConfig.password);
  WiFi.setSleep(false);

  // Attendre la connexion WiFi
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connecté");
    Serial.print("Adresse IP: ");
    Serial.println(WiFi.localIP());
    startMyCameraServer();
  } else {
    Serial.println("\nÉchec de la connexion WiFi");
    // Démarrer le mode AP pour la configuration
    WiFi.mode(WIFI_AP);
    WiFi.softAP("ESP32-CAM-Setup", "12345678");
    dnsServer.start(53, "*", WiFi.softAPIP());
    setupConfigServer();
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Le serveur de caméra gère les requêtes
    server.handleClient();
  } else {
    // Gérer les requêtes de configuration
    dnsServer.processNextRequest();
    server.handleClient();
  }
} 