/** @format */

import Header from "@/components/Header";
import { Alert, getAlerts } from "@/utils/database";
import {
  fetchAlertsFromESP8266,
  startAlertListener
} from "@/utils/esp8266Service";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const formatRelativeDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
  const diffInDays = diffInSeconds / (60 * 60 * 24);

  const timeFormat = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  if (diffInDays < 1 && now.getDate() === date.getDate()) {
    return `Aujourd'hui à ${timeFormat.format(date)}`;
  }
  if (diffInDays < 2 && now.getDate() - 1 === date.getDate()) {
    return `Hier à ${timeFormat.format(date)}`;
  }
  return `Le ${date.toLocaleDateString("fr-FR")} à ${timeFormat.format(date)}`;
};

const HistoriqueScreen = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const localAlerts = await getAlerts();
      const esp8266Alerts = await fetchAlertsFromESP8266();
      setAlerts([...esp8266Alerts, ...localAlerts]);
    } catch (error) {
      console.error("Erreur lors du chargement des alertes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    startAlertListener((newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });
  }, [loadAlerts]);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, [loadAlerts]);

  const renderAlertItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={[styles.alertItem, !item.read && styles.unreadAlert]}
      onPress={() => {
        if (item.id) {
          router.push(`/alert-detail/${item.id}`);
        }
      }}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertType}>
          {item.type === "supplis" ? "Supplis" : "Manque"}
        </Text>
        <Text style={styles.alertDate}>{formatRelativeDate(item.date)}</Text>
      </View>
      <Text style={styles.alertMessage}>{item.message}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Historique des alertes"
        subtitle="Consultez l'historique complet"
        showIcons={true}
      />
      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading
                ? "Chargement des alertes..."
                : "Aucune alerte enregistrée"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default HistoriqueScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  listContainer: {
    padding: 16
  },
  alertItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF"
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  alertType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF"
  },
  alertDate: {
    fontSize: 14,
    color: "#666"
  },
  alertMessage: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center"
  }
});
