/** @format */

import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Comment configurer l'ESP32-CAM ?",
      answer:
        "Pour configurer votre ESP32-CAM, suivez ces étapes :\n1. Connectez l'ESP32-CAM à votre ordinateur\n2. Téléchargez le firmware depuis notre site\n3. Configurez le WiFi dans le fichier de configuration\n4. Redémarrez l'appareil"
    },
    {
      question: "L'application ne se connecte pas à la caméra",
      answer:
        "Vérifiez que :\n• L'ESP32-CAM est allumé\n• Vous êtes sur le même réseau WiFi\n• L'adresse IP est correcte dans les paramètres\n• Le port 81 est accessible"
    },
    {
      question: "Comment mettre à jour l'application ?",
      answer:
        "Les mises à jour sont automatiques sur les stores. Pour une mise à jour manuelle, visitez notre site web et téléchargez la dernière version."
    },
    {
      question: "Les alertes ne fonctionnent pas",
      answer:
        "Assurez-vous que :\n• Les notifications sont activées\n• La distance de détection est correctement réglée\n• L'ESP32-CAM est bien positionné"
    }
  ];

  const handleSubmit = () => {
    if (!subject || !message) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    // Ici, vous pouvez ajouter la logique d'envoi du message
    Alert.alert(
      "Message envoyé",
      "Nous vous répondrons dans les plus brefs délais",
      [
        {
          text: "OK",
          onPress: () => {
            setSubject("");
            setMessage("");
          }
        }
      ]
    );
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Header
        title="Support"
        subtitle="Nous sommes là pour vous aider"
        showBackButton={true}
      />
      <ScrollView style={styles.content}>
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contactez-nous</Text>
          <TextInput
            style={styles.input}
            placeholder="Sujet"
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Votre message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleFaq(index)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#1a73e8"
                />
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Autres moyens de contact</Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={24} color="#1a73e8" />
            <Text style={styles.contactText}>support@bieuf.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={24} color="#1a73e8" />
            <Text style={styles.contactText}>+33 1 23 45 67 89</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="time-outline" size={24} color="#1a73e8" />
            <Text style={styles.contactText}>Lun-Ven: 9h-18h</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/(tabs)")}>
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
  contactSection: {
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
    fontSize: 20,
    fontWeight: "600",
    color: "#1a73e8",
    marginBottom: 15
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16
  },
  messageInput: {
    height: 120,
    textAlignVertical: "top"
  },
  submitButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 15,
    alignItems: "center"
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  faqSection: {
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
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 15
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
    marginRight: 10
  },
  faqAnswer: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    lineHeight: 20
  },
  contactInfo: {
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
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a73e8",
    marginBottom: 15
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  contactText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10
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
