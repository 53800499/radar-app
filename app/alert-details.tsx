/** @format */

import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function AlertDetails() {
  const router = useRouter();
  const { alert } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const textColor = Colors[colorScheme ?? "light"].text;

  // Simulation de données d'alerte (à remplacer par vos vraies données)
  const alertData = {
    id: "1",
    type: "Mouvement suspect",
    timestamp: "2024-03-20 14:30:45",
    location: "Zone A - Enclos 3",
    severity: "Élevée",
    description:
      "Détection de mouvement inhabituel dans l'enclos 3. Possible intrusion ou comportement anormal du bétail.",
    status: "En cours d'analyse",
    image: require("../assets/placeholder.jpg"), // Remplacer par l'image réelle de l'alerte
    actions: [
      {
        id: "1",
        type: "Vérification",
        status: "En cours",
        timestamp: "2024-03-20 14:35:00"
      },
      {
        id: "2",
        type: "Notification envoyée",
        status: "Terminé",
        timestamp: "2024-03-20 14:31:00"
      }
    ]
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "élevée":
        return "#ea4335";
      case "moyenne":
        return "#fbbc05";
      case "basse":
        return "#34a853";
      default:
        return "#666";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "en cours d'analyse":
        return "#fbbc05";
      case "résolu":
        return "#34a853";
      case "en attente":
        return "#ea4335";
      default:
        return "#666";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Header
        title="Détails de l'alerte"
        subtitle="Informations complètes"
        showIcons={true}
      />
      <ScrollView style={styles.content}>
        <View style={styles.alertHeader}>
          <View style={styles.alertTypeContainer}>
            <Ionicons
              name="alert-circle"
              size={24}
              color={getSeverityColor(alertData.severity)}
            />
            <Text
              style={[
                styles.alertType,
                { color: getSeverityColor(alertData.severity) }
              ]}>
              {alertData.type}
            </Text>
          </View>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(alertData.severity) }
            ]}>
            <Text style={styles.severityText}>{alertData.severity}</Text>
          </View>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={alertData.image}
            style={styles.alertImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{alertData.timestamp}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{alertData.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#666"
            />
            <Text style={styles.infoText}>{alertData.status}</Text>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{alertData.description}</Text>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions entreprises</Text>
          {alertData.actions.map((action) => (
            <View key={action.id} style={styles.actionItem}>
              <View style={styles.actionHeader}>
                <Text style={styles.actionType}>{action.type}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(action.status) }
                  ]}>
                  <Text style={styles.statusText}>{action.status}</Text>
                </View>
              </View>
              <Text style={styles.actionTimestamp}>{action.timestamp}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Marquer comme résolu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}>
            <Ionicons name="refresh-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    padding: 20
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  alertTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  alertType: {
    fontSize: 20,
    fontWeight: "600"
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  severityText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20
  },
  alertImage: {
    width: "100%",
    height: "100%"
  },
  infoSection: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  infoText: {
    fontSize: 16,
    color: "#333"
  },
  descriptionSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333"
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666"
  },
  actionsSection: {
    marginBottom: 20
  },
  actionItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5
  },
  actionType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333"
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500"
  },
  actionTimestamp: {
    fontSize: 14,
    color: "#666"
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8
  },
  secondaryButton: {
    backgroundColor: "#666"
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500"
  }
});
