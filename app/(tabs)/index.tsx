/** @format */
import { ESP32CameraStream } from "@/components/ESP32CameraStream";
import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getUnreadAlertsCount } from "@/utils/database";
import {
  configureRadar,
  fetchRadarData,
  getRadarConfig,
  startAlertListener
} from "@/utils/esp8266Service";
import { ESP32_CAM_IP } from "@/utils/networkConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function AccueilScreen() {
  const [distance, setDistance] = useState(120);
  const [objectCount, setObjectCount] = useState(0);
  const [expectedCount, setExpectedCount] = useState(2);
  const [radarStatus, setRadarStatus] = useState("Connexion...");
  const liveDotOpacity = useRef(new Animated.Value(1)).current;
  const [ipAddress, setIpAddress] = useState(ESP32_CAM_IP);
  const [isStreaming, setIsStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const textColor = Colors[colorScheme ?? "light"].text;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateLiveDot = () => {
      Animated.sequence([
        Animated.timing(liveDotOpacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(liveDotOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ]).start(() => animateLiveDot());
    };
    animateLiveDot();
  }, [liveDotOpacity]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, [cardScale, cardOpacity]);

  useEffect(() => {
    const initializeRadar = async () => {
      try {
        const config = await getRadarConfig();
        if (config) {
          setExpectedCount(config.expectedCount);
        }
        const count = await getUnreadAlertsCount();
        setUnreadCount(count);

        const stopListener = startAlertListener(async (alert) => {
          console.log("Nouvelle alerte reçue:", alert);
          const newCount = await getUnreadAlertsCount();
          setUnreadCount(newCount);
        });

        const radarInterval = setInterval(async () => {
          try {
            const radarData = await fetchRadarData();
            if (radarData) {
              setDistance(radarData.distance);
              setObjectCount(radarData.objectCount);
              setRadarStatus("Connecté");
            } else {
              setRadarStatus("Aucune donnée");
            }
          } catch (error) {
            console.log(
              "Erreur lors de la récupération des données radar:",
              error
            );
            setRadarStatus("Erreur");
          }
        }, 3000);

        return () => {
          if (stopListener) {
            stopListener();
          }
          clearInterval(radarInterval);
        };
      } catch (error) {
        console.error("Erreur lors de l'initialisation du radar:", error);
        setRadarStatus("Erreur de connexion");
      }
    };

    initializeRadar();
  }, []);

  const getDistanceValueColor = () => {
    if (distance < 50) return "#e74c3c";
    if (distance < 100) return "#f39c12";
    return "#27ae60";
  };

  const getObjectCountColor = () => {
    if (objectCount > expectedCount) return "#e74c3c"; // Rouge pour surplus
    if (objectCount < expectedCount) return "#f39c12"; // Orange pour manque
    return "#27ae60"; // Vert pour normal
  };

  const handleStreamError = (error: string) => {
    setError(error);
    setIsLoading(false);
  };

  const handleStreamLoad = () => {
    setError(null);
    setIsLoading(false);
  };

  const handleFullscreen = () => {
    router.push({
      pathname: "/fullscreen",
      params: { ipAddress }
    });
  };

  const handleRefresh = async () => {
    console.log("=== DÉBUT REFRESH ===");
    setError(null);
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1); // recharge la caméra
    console.log("Caméra rechargée, refreshKey:", refreshKey + 1);

    // Récupère immédiatement les données radar
    try {
      console.log("Tentative de récupération des données radar...");
      const radarData = await fetchRadarData();
      console.log("Données radar reçues:", radarData);

      if (radarData) {
        setDistance(radarData.distance);
        setObjectCount(radarData.objectCount);
        setRadarStatus("Connecté");
        console.log("Données radar mises à jour:", {
          distance: radarData.distance,
          objectCount: radarData.objectCount
        });
      } else {
        setRadarStatus("Aucune donnée");
        console.log("Aucune donnée radar reçue");
      }
    } catch (error) {
      console.log("=== ERREUR REFRESH RADAR ===");
      console.log(
        "Type d'erreur:",
        error instanceof Error ? error.constructor.name : typeof error
      );
      console.log(
        "Message d'erreur:",
        error instanceof Error ? error.message : String(error)
      );
      setRadarStatus("Erreur");
    }
    setIsLoading(false);
    console.log("=== FIN REFRESH ===");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleRefresh();
    setRefreshing(false);
  };

  const handleConfigureRadar = async () => {
    try {
      const success = await configureRadar({
        expectedCount: expectedCount,
        detectionThreshold: 30
      });

      if (success) {
        console.log("Configuration radar mise à jour");
      } else {
        console.log("Erreur lors de la configuration du radar");
      }
    } catch (error) {
      console.error("Erreur lors de la configuration:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Surveillance Bétail"
        subtitle="Contrôle en temps réel"
        notificationCount={unreadCount}
      />
      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Section Radar (Nouveau Design) */}
        <View style={styles.radarSectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Données du Radar</Text>
            <TouchableOpacity
              style={styles.radarVisualizationButton}
              onPress={() => router.push("/radar-visualization")}>
              <Ionicons name="compass-outline" size={20} color="#1a73e8" />
              <Text style={styles.radarVisualizationText}>Visualisation</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCardsContainer}>
            <Animated.View
              style={[
                styles.infoCard,
                { opacity: cardOpacity, transform: [{ scale: cardScale }] }
              ]}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="resize"
                  size={24}
                  color={getDistanceValueColor()}
                />
                <Text style={styles.infoCardLabel}>Distance</Text>
              </View>
              <Text
                style={[
                  styles.infoCardValue,
                  { color: getDistanceValueColor() }
                ]}>
                {distance} <Text style={styles.unitText}>cm</Text>
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.infoCard,
                { opacity: cardOpacity, transform: [{ scale: cardScale }] }
              ]}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="layers-outline"
                  size={24}
                  color={getObjectCountColor()}
                />
                <Text style={styles.infoCardLabel}>Objets Détectés</Text>
              </View>
              <Text
                style={[
                  styles.infoCardValue,
                  { color: getObjectCountColor() }
                ]}>
                {objectCount} / {expectedCount}
              </Text>
            </Animated.View>
          </View>
          <View style={styles.radarStatusContainer}>
            <Animated.View
              style={[styles.liveDot, { opacity: liveDotOpacity }]}
            />
            <Text style={styles.radarStatusText}>Statut: {radarStatus}</Text>
          </View>
        </View>

        {/* Section Caméra (Ancien Design) */}
        <Text style={styles.sectionTitle}>Caméra de Surveillance</Text>
        <Animated.View
          style={[
            styles.cameraCard,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }]
            }
          ]}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#ea4335" />
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorSubText}>
                Vérifiez que votre ESP32-CAM est bien connecté et que l{"'"}
                adresse IP est correcte
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.refreshButtonText}>Rafraîchir</Text>
              </TouchableOpacity>
            </View>
          )}
          {!error && (
            <ESP32CameraStream
              key={refreshKey}
              ipAddress={ipAddress}
              onError={handleStreamError}
              onLoad={handleStreamLoad}
            />
          )}
          <View style={styles.cameraOverlay}>
            <View style={styles.liveIndicator}>
              <Animated.View
                style={[styles.liveDot, { opacity: liveDotOpacity }]}
              />
              <Text style={styles.liveText}>En direct</Text>
            </View>
            <View style={styles.overlayButtons}>
              <TouchableOpacity
                style={styles.refreshOverlayButton}
                onPress={handleRefresh}>
                <Ionicons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={handleFullscreen}>
                <Ionicons name="expand-outline" size={24} color="#fff" />
                <Text style={styles.fullscreenButtonText}>Plein écran</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="wifi-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="Adresse IP ESP32-CAM"
              placeholderTextColor="#666"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isStreaming ? "#ea4335" : "#34a853" }
            ]}
            onPress={() => setIsStreaming(!isStreaming)}>
            <Ionicons
              name={isStreaming ? "pause" : "play"}
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {isStreaming ? "Arrêter" : "Démarrer"} le flux
            </Text>
          </TouchableOpacity>
          {/* Bouton de test de connectivité */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#1a73e8", marginTop: 10 }
            ]}
            onPress={async () => {
              try {
                console.log("=== TEST CONNEXION ESP32-CAM ===");
                console.log("URL testée:", `http://${ipAddress}:81/status`);
                console.log("Début de la requête...");

                const response = await fetch(`http://${ipAddress}:81/status`);
                console.log("Réponse reçue, status:", response.status);

                if (response.ok) {
                  const data = await response.json();
                  console.log("ESP32-CAM connecté !", data);
                  alert("ESP32-CAM connecté avec succès !");
                } else {
                  console.log(
                    "ESP32-CAM répond mais avec erreur:",
                    response.status
                  );
                  alert(
                    `ESP32-CAM répond mais avec erreur: ${response.status}`
                  );
                }
              } catch (error) {
                console.log("=== ERREUR ESP32-CAM ===");
                console.log(
                  "Type d'erreur:",
                  error instanceof Error ? error.constructor.name : typeof error
                );
                console.log(
                  "Message d'erreur:",
                  error instanceof Error ? error.message : String(error)
                );
                console.log(
                  "Stack trace:",
                  error instanceof Error ? error.stack : "N/A"
                );

                alert(
                  `Erreur de connexion ESP32-CAM: ${
                    error instanceof Error ? error.message : String(error)
                  }`
                );
              }
            }}>
            <Ionicons
              name="wifi"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Tester la connexion ESP32...</Text>
          </TouchableOpacity>
          {/* Bouton de test de connectivité ESP8266 */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#27ae60", marginTop: 10 }
            ]}
            onPress={async () => {
              try {
                console.log("=== TEST CONNEXION ESP8266 ===");
                console.log("URL testée:", "http://10.72.98.101:81/status");
                console.log("Début de la requête...");

                const response = await fetch("http://10.72.98.101:81/status", {
                  method: "GET"
                });
                console.log("Réponse reçue, status:", response.status);

                if (response.ok) {
                  const data = await response.json();
                  console.log("ESP8266 connecté !", data);
                  alert(
                    `ESP8266 connecté avec succès !\nIP: ${data.ip}\nRSSI: ${
                      data.rssi
                    } dBm\nMode: ${data.mode || "N/A"}`
                  );
                } else {
                  console.log(
                    "ESP8266 répond mais avec erreur:",
                    response.status
                  );
                  alert(`ESP8266 répond mais avec erreur: ${response.status}`);
                }
              } catch (error) {
                console.log("=== ERREUR ESP8266 ===");
                console.log(
                  "Type d'erreur:",
                  error instanceof Error ? error.constructor.name : typeof error
                );
                console.log(
                  "Message d'erreur:",
                  error instanceof Error ? error.message : String(error)
                );
                console.log(
                  "Stack trace:",
                  error instanceof Error ? error.stack : "N/A"
                );

                let errorMessage =
                  "Erreur de connexion ESP8266.\n\nVérifiez:\n";
                errorMessage += "1. L'ESP8266 est alimenté\n";
                errorMessage += "2. Il est connecté au WiFi\n";
                errorMessage += "3. L'adresse IP est correcte\n";
                errorMessage += "4. Votre téléphone est sur le même réseau\n";
                errorMessage += "5. Le serveur web Arduino est démarré\n\n";
                errorMessage += `Erreur: ${
                  error instanceof Error ? error.message : String(error)
                }`;

                alert(errorMessage);
              }
            }}>
            <Ionicons
              name="compass"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Tester ESP8266</Text>
          </TouchableOpacity>
          ;{/* Bouton de diagnostic complet ESP8266 */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#9b59b6", marginTop: 10 }
            ]}
            onPress={() => router.push("/esp8266-diagnostic")}>
            <Ionicons
              name="medical"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Diagnostic complet</Text>
          </TouchableOpacity>
          ;{/* Bouton de scan d'adresses IP */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#e67e22", marginTop: 10 }
            ]}
            onPress={async () => {
              const possibleIPs = [
                "192.168.1.100",
                "192.168.1.103",
                "192.168.1.104",
                "192.168.1.105",
                "192.168.1.106",
                "192.168.1.107",
                "192.168.1.108",
                "192.168.1.109",
                "192.168.1.102"
              ];

              let foundIPs = [];

              for (const ip of possibleIPs) {
                try {
                  console.log(`Test de l'adresse IP: ${ip}`);
                  const response = await fetch(`http://${ip}:81/status`);

                  if (response.ok) {
                    const data = await response.json();
                    if (data.status === "ok" || data.mode === "test") {
                      foundIPs.push({ ip, data });
                      console.log(`ESP8266 trouvé à l'adresse: ${ip}`);
                    }
                  }
                } catch (error) {
                  console.log(`Pas d'ESP8266 à l'adresse: ${ip}`);
                }
              }

              if (foundIPs.length > 0) {
                let message = "ESP8266 trouvé(s) :\n\n";
                foundIPs.forEach(({ ip, data }) => {
                  message += `IP: ${ip}\n`;
                  message += `Mode: ${data.mode || "N/A"}\n`;
                  message += `RSSI: ${data.rssi || "N/A"} dBm\n\n`;
                });
                alert(message);
              } else {
                alert(
                  "Aucun ESP8266 trouvé sur le réseau.\nVérifiez la connexion WiFi et l'alimentation."
                );
              }
            }}>
            <Ionicons
              name="search"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Scanner le réseau</Text>
          </TouchableOpacity>
          ;
        </View>

        {/* Configuration du radar */}
        <View style={styles.radarConfigContainer}>
          <Text style={styles.configTitle}>Configuration Radar</Text>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Objets attendus:</Text>
            <TextInput
              style={styles.configInput}
              value={expectedCount.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 2;
                setExpectedCount(value);
              }}
              keyboardType="numeric"
              placeholder="2"
            />
            <TouchableOpacity
              style={styles.configButton}
              onPress={handleConfigureRadar}>
              <Ionicons name="save" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.radarStatus}>Statut: {radarStatus}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f6"
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 20,
    marginTop: 15,
    textAlign: "left"
  },
  // Nouveaux styles pour la section radar
  radarSectionContainer: {
    marginBottom: 30
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  radarVisualizationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8
  },
  radarVisualizationText: {
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6
  },
  infoCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center"
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1
  },
  infoCardLabel: {
    fontSize: 16,
    color: "#7f8c8d",
    marginLeft: 8,
    fontWeight: "600"
  },
  infoCardValue: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center"
  },
  unitText: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#7f8c8d"
  },
  radarStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3
  },
  radarStatusText: {
    fontSize: 16,
    color: "#34495e"
  },
  // Fin des nouveaux styles

  cameraCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 25,
    minHeight: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ea4335",
    marginRight: 6
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  overlayButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  refreshOverlayButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
    borderRadius: 20
  },
  fullscreenButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  fullscreenButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600"
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa"
  },
  errorText: {
    fontSize: 18,
    color: "#ea4335",
    marginTop: 10,
    textAlign: "center"
  },
  errorSubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "center"
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a73e8",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8
  },
  inputContainer: {
    marginBottom: 25
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  buttonIcon: {
    marginRight: 8
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  radarConfigContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15
  },
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },
  configLabel: {
    fontSize: 16,
    color: "#666",
    marginRight: 10,
    flex: 1
  },
  configInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 60,
    textAlign: "center",
    marginRight: 10
  },
  configButton: {
    backgroundColor: "#1a73e8",
    padding: 8,
    borderRadius: 8
  },
  radarStatus: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic"
  }
});
