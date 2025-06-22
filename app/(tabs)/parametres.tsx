/** @format */

import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function ParametresScreen() {
  const router = useRouter();
  const [alertesActives, setAlertesActives] = useState(true);
  const [distanceDetection, setDistanceDetection] = useState(100); // en cm
  const [notificationsActives, setNotificationsActives] = useState(true);
  const [modeSombre, setModeSombre] = useState(false);
  const [sauvegardeAuto, setSauvegardeAuto] = useState(true);

  const handleDeconnexion = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      {
        text: "Annuler",
        style: "cancel"
      },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: () => {
          // Logique de déconnexion
          console.log("Déconnexion...");
        }
      }
    ]);
  };

  const handleGuideUtilisation = () => {
    router.push("/guide-utilisation");
  };

  const handleAPropos = () => {
    router.push("/a-propos");
  };

  const handleSupport = () => {
    router.push("/support");
  };

  const handleConfidentialite = () => {
    router.push("/confidentialite");
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={22} color="#1a73e8" />
        </View>
        <Text style={styles.settingItemText}>{title}</Text>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color="#666" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Paramètres" showIcons={false} />
      <ScrollView style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Surveillance</Text>
          {renderSettingItem(
            "notifications-outline",
            "Alertes",
            undefined,
            <Switch
              value={alertesActives}
              onValueChange={setAlertesActives}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={alertesActives ? "#1a73e8" : "#f4f3f4"}
            />
          )}
          {renderSettingItem(
            "notifications-outline",
            "Notifications",
            undefined,
            <Switch
              value={notificationsActives}
              onValueChange={setNotificationsActives}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={notificationsActives ? "#1a73e8" : "#f4f3f4"}
            />
          )}
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Distance minimale de détection : {distanceDetection} cm
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={30}
              maximumValue={200}
              step={5}
              value={distanceDetection}
              onValueChange={setDistanceDetection}
              minimumTrackTintColor="#1a73e8"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#1a73e8"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          {renderSettingItem(
            "moon-outline",
            "Mode sombre",
            undefined,
            <Switch
              value={modeSombre}
              onValueChange={setModeSombre}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={modeSombre ? "#1a73e8" : "#f4f3f4"}
            />
          )}
          {renderSettingItem(
            "cloud-upload-outline",
            "Sauvegarde automatique",
            undefined,
            <Switch
              value={sauvegardeAuto}
              onValueChange={setSauvegardeAuto}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={sauvegardeAuto ? "#1a73e8" : "#f4f3f4"}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aide et Support</Text>
          {renderSettingItem(
            "book-outline",
            "Guide d'utilisation",
            handleGuideUtilisation
          )}
          {renderSettingItem("help-circle-outline", "Support", handleSupport)}
          {renderSettingItem(
            "information-circle-outline",
            "À propos",
            handleAPropos
          )}
          {renderSettingItem(
            "shield-outline",
            "Confidentialité",
            handleConfidentialite
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          {renderSettingItem("person-outline", "Profil", () => {})}
          {renderSettingItem(
            "log-out-outline",
            "Déconnexion",
            handleDeconnexion
          )}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: "#f8f9fa"
  },
  contentContainer: {
    flex: 1
  },
  section: {
    marginBottom: 30,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
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
    marginBottom: 15,
    marginLeft: 10
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(26, 115, 232, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  settingItemText: {
    fontSize: 16,
    color: "#333"
  },
  sliderContainer: {
    padding: 10
  },
  sliderLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10
  },
  slider: {
    width: "100%",
    height: 40
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 20
  },
  versionText: {
    fontSize: 14,
    color: "#666"
  }
});
