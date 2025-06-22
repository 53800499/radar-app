/** @format */

import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function GuideUtilisationScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const router = useRouter();

  const renderSection = (title: string, content: string, icon: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color="#1a73e8" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Header
        title="Guide d'utilisation"
        subtitle="Tout ce que vous devez savoir"
        showBackButton={true}
      />
      <ScrollView style={styles.content}>
        {renderSection(
          "Premiers pas",
          "Bienvenue dans l'application Bieuf ! Pour commencer, assurez-vous que votre ESP32-CAM est correctement configuré et connecté au même réseau que votre appareil. L'adresse IP par défaut est 192.168.46.240, mais vous pouvez la modifier dans les paramètres si nécessaire.",
          "rocket-outline"
        )}

        {renderSection(
          "Surveillance en direct",
          "La page d'accueil vous permet de surveiller en temps réel votre bétail. Le flux vidéo s'affiche automatiquement une fois la connexion établie. Vous pouvez passer en mode plein écran pour une meilleure visibilité.",
          "videocam-outline"
        )}

        {renderSection(
          "Alertes et notifications",
          "L'application vous alerte automatiquement lorsque des mouvements sont détectés à proximité de vos animaux. Vous pouvez ajuster la distance de détection dans les paramètres selon vos besoins.",
          "notifications-outline"
        )}

        {renderSection(
          "Historique des alertes",
          "Consultez l'historique complet des alertes dans l'onglet 'Historique'. Vous pouvez voir les détails de chaque alerte, y compris les captures d'écran et les enregistrements vidéo associés.",
          "time-outline"
        )}

        {renderSection(
          "Paramètres avancés",
          "Dans les paramètres, vous pouvez personnaliser :\n• La distance de détection\n• Les notifications\n• Le mode sombre\n• La sauvegarde automatique\n• Et bien plus encore !",
          "settings-outline"
        )}

        {renderSection(
          "Conseils d'utilisation",
          "• Placez l'ESP32-CAM à une hauteur optimale pour une meilleure couverture\n• Assurez-vous que la connexion WiFi est stable\n• Vérifiez régulièrement les mises à jour de l'application\n• Sauvegardez vos paramètres après chaque modification",
          "bulb-outline"
        )}

        {renderSection(
          "Dépannage",
          "Si vous rencontrez des problèmes :\n• Vérifiez la connexion WiFi\n• Redémarrez l'ESP32-CAM\n• Mettez à jour le firmware si nécessaire\n• Contactez le support si le problème persiste",
          "construct-outline"
        )}

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/(tabs)")}>
          <Ionicons name="home-outline" size={24} color="#fff" />
          <Text style={styles.homeButtonText}>Retour à l{"'"}accueil</Text>
        </TouchableOpacity>
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
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(26, 115, 232, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a73e8"
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333"
  },
  homeButton: {
    backgroundColor: "#1a73e8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8
  }
});
