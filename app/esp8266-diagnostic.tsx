/** @format */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ESP8266_BASE_URL } from "../utils/networkConfig";

interface DiagnosticResult {
  test: string;
  status: "success" | "error" | "loading";
  message: string;
  data?: any;
}

export default function ESP8266Diagnostic() {
  const router = useRouter();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    const tests = [
      {
        name: "Connectivité de base",
        url: `${ESP8266_BASE_URL}/status`,
        description: "Test de connexion HTTP"
      },
      {
        name: "Données radar",
        url: `${ESP8266_BASE_URL}/radar`,
        description: "Récupération des données radar"
      },
      {
        name: "Configuration",
        url: `${ESP8266_BASE_URL}/config`,
        description: "Récupération de la configuration"
      },
      {
        name: "Alertes",
        url: `${ESP8266_BASE_URL}/alerts`,
        description: "Récupération des alertes"
      }
    ];

    for (const test of tests) {
      // Ajouter le test en cours
      setResults((prev) => [
        ...prev,
        {
          test: test.name,
          status: "loading",
          message: "Test en cours..."
        }
      ]);

      try {
        const response = await fetch(test.url, {
          method: "GET",
          headers: {
            Accept: "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          setResults((prev) => [
            ...prev.slice(0, -1),
            {
              test: test.name,
              status: "success",
              message: `${test.description} - OK`,
              data: data
            }
          ]);
        } else {
          setResults((prev) => [
            ...prev.slice(0, -1),
            {
              test: test.name,
              status: "error",
              message: `${test.description} - Erreur HTTP ${response.status}`
            }
          ]);
        }
      } catch (error) {
        setResults((prev) => [
          ...prev.slice(0, -1),
          {
            test: test.name,
            status: "error",
            message: `${test.description} - ${
              error instanceof Error ? error.message : "Erreur inconnue"
            }`
          }
        ]);
      }

      // Pause entre les tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "#27ae60";
      case "error":
        return "#e74c3c";
      case "loading":
        return "#f39c12";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "loading":
        return "time";
      default:
        return "help-circle";
    }
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
        <Text style={styles.title}>Diagnostic ESP8266</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.ipAddress}>{ESP8266_BASE_URL}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle" size={24} color="#1a73e8" />
          <Text style={styles.instructionsText}>
            Cette page teste la connectivité et les fonctionnalités de votre
            ESP8266. Assurez-vous que l{"'"}ESP8266 est alimenté et connecté au même
            réseau WiFi.
          </Text>
        </View>

        {/* Bouton de diagnostic */}
        <TouchableOpacity
          style={[
            styles.diagnosticButton,
            { backgroundColor: isRunning ? "#ccc" : "#1a73e8" }
          ]}
          onPress={runDiagnostic}
          disabled={isRunning}>
          <Ionicons
            name={isRunning ? "hourglass" : "play"}
            size={20}
            color="#fff"
          />
          <Text style={styles.diagnosticButtonText}>
            {isRunning ? "Diagnostic en cours..." : "Lancer le diagnostic"}
          </Text>
        </TouchableOpacity>

        {/* Résultats */}
        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Résultats des tests :</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={getStatusIcon(result.status)}
                    size={20}
                    color={getStatusColor(result.status)}
                  />
                  <Text style={styles.resultTest}>{result.test}</Text>
                </View>
                <Text style={styles.resultMessage}>{result.message}</Text>
                {result.data && (
                  <View style={styles.dataContainer}>
                    <Text style={styles.dataTitle}>Données reçues :</Text>
                    <Text style={styles.dataText}>
                      {JSON.stringify(result.data, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                "Redémarrer l'ESP8266",
                "Voulez-vous redémarrer l'ESP8266 ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Redémarrer",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await fetch(`${ESP8266_BASE_URL}/restart`);
                        Alert.alert(
                          "Redémarrage",
                          "L'ESP8266 va redémarrer dans quelques secondes."
                        );
                      } catch (error) {
                        Alert.alert(
                          "Erreur",
                          "Impossible de redémarrer l'ESP8266."
                        );
                      }
                    }
                  }
                ]
              );
            }}>
            <Ionicons name="refresh" size={20} color="#e74c3c" />
            <Text style={styles.actionButtonText}>Redémarrer ESP8266</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: "flex-end"
  },
  ipAddress: {
    fontSize: 12,
    color: "#666"
  },
  content: {
    flex: 1,
    padding: 20
  },
  instructionsContainer: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  instructionsText: {
    flex: 1,
    marginLeft: 10,
    color: "#1565c0",
    fontSize: 14
  },
  diagnosticButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a73e8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  diagnosticButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10
  },
  resultsContainer: {
    marginBottom: 20
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15
  },
  resultItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5
  },
  resultTest: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10
  },
  resultMessage: {
    fontSize: 14,
    color: "#666",
    marginLeft: 30
  },
  dataContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 5
  },
  dataTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5
  },
  dataText: {
    fontSize: 11,
    color: "#666",
    fontFamily: "monospace"
  },
  actionsContainer: {
    marginTop: 20
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e74c3c"
  },
  actionButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10
  }
});
