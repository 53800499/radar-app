/** @format */

import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function AProposScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const router = useRouter();

  const renderInfoSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Header
        title="À propos"
        subtitle="Informations sur l'application"
        showBackButton={true}
      />
      <ScrollView style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/background.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Bieuf</Text>
          <Text style={styles.version}>Version 2.1.0</Text>
        </View>

        {renderInfoSection(
          "Notre mission",
          "Bieuf est une application innovante conçue pour simplifier la surveillance de votre bétail. Notre objectif est de vous offrir une solution fiable et intuitive pour assurer la sécurité de vos animaux."
        )}

        {renderInfoSection(
          "Fonctionnalités principales",
          "• Surveillance en temps réel\n• Détection de mouvement\n• Alertes instantanées\n• Historique des événements\n• Interface intuitive\n• Mode hors ligne"
        )}

        {renderInfoSection(
          "Technologies utilisées",
          "• React Native\n• Expo\n• ESP32-CAM\n• SQLite\n• WebSocket\n• TypeScript"
        )}

        {renderInfoSection(
          "Contact",
          "Pour toute question ou suggestion, n'hésitez pas à nous contacter :\n\nEmail : support@bieuf.com\nTéléphone : +33 1 23 45 67 89"
        )}

        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © 2024 Bieuf. Tous droits réservés.
          </Text>
          <View style={styles.socialLinks}>
            <Ionicons name="logo-facebook" size={24} color="#1a73e8" />
            <Ionicons name="logo-twitter" size={24} color="#1a73e8" />
            <Ionicons name="logo-linkedin" size={24} color="#1a73e8" />
          </View>
        </View>

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
  logoContainer: {
    alignItems: "center",
    marginBottom: 30
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a73e8",
    marginBottom: 5
  },
  version: {
    fontSize: 16,
    color: "#666"
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a73e8",
    marginBottom: 10
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333"
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20
  },
  copyright: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15
  },
  socialLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20
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
