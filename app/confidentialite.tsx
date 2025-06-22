/** @format */

import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ConfidentialiteScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const router = useRouter();

  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Header
        title="Politique de confidentialité"
        subtitle="Protection de vos données"
        showBackButton={true}
      />
      <ScrollView style={styles.content}>
        {renderSection(
          "Introduction",
          "Chez Bieuf, nous accordons une grande importance à la protection de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations."
        )}

        {renderSection(
          "Données collectées",
          "Nous collectons uniquement les données nécessaires au bon fonctionnement de l'application :\n\n• Informations de connexion\n• Données de localisation\n• Images et vidéos de surveillance\n• Historique des alertes\n• Paramètres de l'application"
        )}

        {renderSection(
          "Utilisation des données",
          "Vos données sont utilisées pour :\n\n• Fournir le service de surveillance\n• Envoyer des alertes\n• Améliorer l'application\n• Assurer la sécurité du système"
        )}

        {renderSection(
          "Protection des données",
          "Nous mettons en œuvre des mesures de sécurité strictes pour protéger vos données :\n\n• Chiffrement des communications\n• Stockage sécurisé\n• Accès restreint\n• Sauvegardes régulières"
        )}

        {renderSection(
          "Partage des données",
          "Nous ne partageons vos données qu'avec :\n\n• Les services techniques nécessaires\n• Les autorités compétentes sur demande légale\n• Vous-même, sur votre demande"
        )}

        {renderSection(
          "Vos droits",
          "Vous disposez des droits suivants :\n\n• Accès à vos données\n• Rectification des données\n• Suppression des données\n• Opposition au traitement\n• Portabilité des données"
        )}

        {renderSection(
          "Conservation des données",
          "Nous conservons vos données :\n\n• Pendant la durée d'utilisation de l'application\n• Jusqu'à 30 jours après la suppression du compte\n• Selon les obligations légales"
        )}

        {renderSection(
          "Contact",
          "Pour toute question concernant vos données :\n\nEmail : bassirousikirou@gmail.com\nTéléphone : +229 01 53 80 04 99\nAdresse : 123 rue de la Protection, 75000 Paris"
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dernière mise à jour : 22 juin 20024
          </Text>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/(tabs)")}
        >
          <Ionicons name="home-outline" size={24} color="#fff" />
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
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
  footerText: {
    fontSize: 14,
    color: "#666"
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
