/** @format */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { fetchRadarData } from "../utils/esp8266Service";

const { width, height } = Dimensions.get("window");
const RADAR_SIZE = Math.min(width * 0.8, height * 0.6);
const RADAR_RADIUS = RADAR_SIZE / 2;

interface RadarData {
  angle: number;
  distance: number;
  objectCount: number;
  timestamp: string;
}

export default function RadarVisualization() {
  const router = useRouter();
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const sweepAngle = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const objectPulse = useRef(new Animated.Value(1)).current;

  // État de l'animation
  const [isSweeping, setIsSweeping] = useState(true);

  // Démarrer l'animation de balayage
  const startSweepAnimation = () => {
    if (!isSweeping) return;

    Animated.sequence([
      Animated.timing(sweepAngle, {
        toValue: 180,
        duration: 2000,
        useNativeDriver: false
      }),
      Animated.timing(sweepAngle, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false
      })
    ]).start(() => {
      if (isSweeping) {
        startSweepAnimation();
      }
    });
  };

  // Animation de pulsation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: false
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false
        })
      ])
    ).start();
  };

  // Animation des objets détectés
  const startObjectPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(objectPulse, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: false
        }),
        Animated.timing(objectPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false
        })
      ])
    ).start();
  };

  // Récupérer les données radar
  const fetchData = async () => {
    try {
      const data = await fetchRadarData();
      if (data) {
        setRadarData(data);
        setIsConnected(true);
        setError(null);
      } else {
        setIsConnected(false);
        setError("Aucune donnée disponible");
      }
    } catch (err) {
      setIsConnected(false);
      setError("Erreur de connexion");
    }
  };

  useEffect(() => {
    // Démarrer les animations
    startSweepAnimation();
    startPulseAnimation();
    startObjectPulseAnimation();

    // Récupérer les données initiales
    fetchData();

    // Polling des données toutes les 2 secondes
    const interval = setInterval(fetchData, 2000);

    return () => {
      clearInterval(interval);
      setIsSweeping(false);
    };
  }, []);

  // Calculer la position des objets détectés
  const getObjectPosition = (angle: number, distance: number) => {
    const maxDistance = 200; // Distance maximale en cm
    const normalizedDistance = Math.min(distance, maxDistance) / maxDistance;
    const radius = normalizedDistance * (RADAR_RADIUS - 40); // Marge de 40px

    const radians = (angle * Math.PI) / 180;
    const x = Math.cos(radians) * radius;
    const y = -Math.sin(radians) * radius; // Inversé pour l'affichage

    return { x, y, radius };
  };

  // Couleur selon la distance
  const getDistanceColor = (distance: number) => {
    if (distance < 50) return "#e74c3c"; // Rouge
    if (distance < 100) return "#f39c12"; // Orange
    return "#27ae60"; // Vert
  };

  // Couleur selon le nombre d'objets
  const getObjectCountColor = (count: number, expected: number = 2) => {
    if (count > expected) return "#e74c3c"; // Rouge pour surplus
    if (count < expected) return "#f39c12"; // Orange pour manque
    return "#27ae60"; // Vert pour normal
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a73e8" />
        </TouchableOpacity>
        <Text style={styles.title}>Visualisation Radar</Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? "#27ae60" : "#e74c3c" }
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? "Connecté" : "Déconnecté"}
          </Text>
        </View>
      </View>

      {/* Radar Display */}
      <View style={styles.radarContainer}>
        <View style={styles.radar}>
          {/* Cercles concentriques */}
          {[1, 2, 3, 4, 5].map((ring) => (
            <View
              key={ring}
              style={[
                styles.radarRing,
                {
                  width: (RADAR_RADIUS * ring) / 5,
                  height: (RADAR_RADIUS * ring) / 5,
                  borderRadius: (RADAR_RADIUS * ring) / 10
                }
              ]}
            />
          ))}

          {/* Lignes de grille */}
          {[0, 45, 90, 135, 180].map((angle) => (
            <View
              key={angle}
              style={[
                styles.gridLine,
                {
                  transform: [{ rotate: `${angle}deg` }, { translateY: -1 }]
                }
              ]}
            />
          ))}

          {/* Aiguille de balayage */}
          <Animated.View
            style={[
              styles.sweepLine,
              {
                transform: [
                  {
                    rotate: sweepAngle.interpolate({
                      inputRange: [0, 180],
                      outputRange: ["0deg", "180deg"]
                    })
                  }
                ]
              }
            ]}
          />

          {/* Objets détectés */}
          {radarData && (
            <Animated.View
              style={[
                styles.objectIndicator,
                {
                  transform: [
                    {
                      translateX: getObjectPosition(
                        radarData.angle,
                        radarData.distance
                      ).x
                    },
                    {
                      translateY: getObjectPosition(
                        radarData.angle,
                        radarData.distance
                      ).y
                    },
                    { scale: objectPulse }
                  ]
                }
              ]}>
              <View
                style={[
                  styles.objectDot,
                  {
                    backgroundColor: getDistanceColor(radarData.distance)
                  }
                ]}
              />
            </Animated.View>
          )}

          {/* Centre du radar */}
          <View style={styles.radarCenter}>
            <Animated.View
              style={[
                styles.centerPulse,
                {
                  transform: [{ scale: pulseScale }]
                }
              ]}
            />
          </View>
        </View>

        {/* Informations radar */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: radarData
                      ? getDistanceColor(radarData.distance)
                      : "#666"
                  }
                ]}>
                {radarData ? `${radarData.distance} cm` : "---"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Angle</Text>
              <Text style={styles.infoValue}>
                {radarData ? `${radarData.angle}°` : "---"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Objets détectés</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: radarData
                      ? getObjectCountColor(radarData.objectCount)
                      : "#666"
                  }
                ]}>
                {radarData ? radarData.objectCount : "---"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dernière mise à jour</Text>
              <Text style={styles.infoValue}>
                {radarData ? radarData.timestamp : "---"}
              </Text>
            </View>
          </View>
        </View>

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#27ae60" }]} />
            <Text style={styles.legendText}>Normal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#f39c12" }]} />
            <Text style={styles.legendText}>Attention</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#e74c3c" }]} />
            <Text style={styles.legendText}>Alerte</Text>
          </View>
        </View>
      </View>

      {/* Message d'erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)"
  },
  backButton: {
    padding: 8
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a73e8"
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    color: "#666"
  },
  radarContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  radar: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    position: "relative",
    alignItems: "center",
    justifyContent: "center"
  },
  radarRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(26, 115, 232, 0.3)",
    backgroundColor: "transparent"
  },
  gridLine: {
    position: "absolute",
    width: RADAR_RADIUS,
    height: 2,
    backgroundColor: "rgba(26, 115, 232, 0.2)"
  },
  sweepLine: {
    position: "absolute",
    width: RADAR_RADIUS,
    height: 2,
    backgroundColor: "#1a73e8",
    borderRadius: 1,
    transform: [{ translateY: -1 }]
  },
  objectIndicator: {
    position: "absolute"
  },
  objectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  radarCenter: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1a73e8",
    alignItems: "center",
    justifyContent: "center"
  },
  centerPulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(26, 115, 232, 0.3)"
  },
  infoContainer: {
    marginTop: 30,
    width: "100%",
    maxWidth: 400
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a73e8"
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 20
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6
  },
  legendText: {
    fontSize: 12,
    color: "#666"
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8d7da",
    margin: 20,
    borderRadius: 10
  },
  errorText: {
    marginLeft: 10,
    color: "#721c24",
    fontSize: 14
  }
});
