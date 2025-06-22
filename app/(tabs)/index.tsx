/** @format */
import { ESP32CameraStream } from "@/components/ESP32CameraStream";
import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";


export default function AccueilScreen() {
  const [distance, setDistance] = useState(120);
  const [derniereAlerte, setDerniereAlerte] = useState("Aucune alerte récente");
  const liveDotOpacity = useRef(new Animated.Value(1)).current;
  const [ipAddress, setIpAddress] = useState("192.168.46.240");
  const [isStreaming, setIsStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const textColor = Colors[colorScheme ?? "light"].text;
  const router = useRouter();

  // Animation pour les cartes
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée des cartes
    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();

    const interval = setInterval(() => {
      const nouvelleDistance = Math.floor(Math.random() * 150 + 30);
      setDistance(nouvelleDistance);
      setDerniereAlerte(calculerAlerte(nouvelleDistance));
    }, 5000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotOpacity, {
          toValue: 0.2,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(liveDotOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const calculerAlerte = (dist: number) => {
    if (dist < 50) return `Bœuf très proche à ${dist} cm !`;
    if (dist < 100) return `Attention, bœuf proche à ${dist} cm.`;
    return "Aucune alerte récente";
  };

  const getDistanceValueColor = () => {
    if (distance < 50) return "#ea4335";
    if (distance < 100) return "#fb662d";
    return "#1a73e8";
  };

  const getAlerteValueColor = () => {
    return derniereAlerte !== "Aucune alerte récente" ? "#ea4335" : "#34a853";
  };

  const handleStreamError = (error: string) => {
    setError(error);
    setIsLoading(false);
  };

  const handleStreamLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleFullscreen = () => {
    router.push({
      pathname: "/fullscreen",
      params: { ipAddress }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Header
        title="Bienvenue sur Bieuf"
        subtitle="Explorez votre ferme"
        showIcons={true}
      />
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.infoCardsContainer,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }]
            }
          ]}>
          <LinearGradient
            colors={["#ffffff", "#f8f9fa"]}
            style={styles.infoCard}>
            <View style={styles.infoCardIconContainer}>
              <Ionicons name="pulse-outline" size={35} color="#1a73e8" />
            </View>
            <Text style={styles.infoCardLabel}>Distance Actuelle</Text>
            <Text
              style={[
                styles.infoCardValue,
                { color: getDistanceValueColor() }
              ]}>
              {distance} cm
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={["#ffffff", "#f8f9fa"]}
            style={styles.infoCard}>
            <View style={styles.infoCardIconContainer}>
              <Ionicons name="alert-circle-outline" size={35} color="#ea4335" />
            </View>
            <Text style={styles.infoCardLabel}>Dernière Alerte</Text>
            <Text
              style={[styles.infoCardValue, { color: getAlerteValueColor() }]}>
              {derniereAlerte}
            </Text>
          </LinearGradient>
        </Animated.View>

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
            </View>
          )}
          {!error && (
            <ESP32CameraStream
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
              <Text style={styles.liveText}>Live Feed</Text>
            </View>
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={handleFullscreen}>
              <Ionicons name="expand-outline" size={24} color="#fff" />
              <Text style={styles.fullscreenButtonText}>Plein écran</Text>
            </TouchableOpacity>
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
        </View>
      </View>
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
    paddingTop: 25
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 20,
    marginTop: 15,
    textAlign: "left"
  },
  infoCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 15
  },
  infoCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  infoCardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(26, 115, 232, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  infoCardLabel: {
    fontSize: 15,
    color: "#7f8c8d",
    marginTop: 10,
    textAlign: "center"
  },
  infoCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8
  },
  cameraCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
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
    padding: 15,
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
  inputContainer: {
    marginBottom: 20
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
  }
});
