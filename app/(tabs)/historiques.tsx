/** @format */

import Header from "@/components/Header";
import { useUnreadAlerts } from "@/hooks/useUnreadAlerts";
import {
  Alert as AlertType,
  deleteAlertById,
  deleteAllAlerts,
  getAlerts
} from "@/utils/database";
import { startAlertListener } from "@/utils/esp8266Service";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Alert as RNAlert,
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
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { unreadCount, updateUnreadCount } = useUnreadAlerts();

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const localAlerts = await getAlerts();
      setAlerts(localAlerts);
      updateUnreadCount(); // Mettre à jour le nombre d'alertes non lues
    } catch (error) {
      console.error("Erreur lors du chargement des alertes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [updateUnreadCount]);

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

  const handleDelete = (id: number) => {
    RNAlert.alert(
      "Supprimer l'alerte",
      "Êtes-vous sûr de vouloir supprimer cette alerte ? Cette action est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteAlertById(id);
            loadAlerts();
            updateUnreadCount(); // Mettre à jour le nombre d'alertes non lues
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    RNAlert.alert(
      "Vider l'historique",
      "Êtes-vous sûr de vouloir supprimer toutes les alertes ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Tout supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteAllAlerts();
            loadAlerts(); // Recharger pour voir la liste vide
            updateUnreadCount(); // Mettre à jour le nombre d'alertes non lues
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    updateUnreadCount(); // Mettre à jour le nombre d'alertes non lues
    setRefreshing(false);
  }, [loadAlerts, updateUnreadCount]);

  const renderAlertItem = ({ item }: { item: AlertType }) => (
    <View style={styles.alertItemContainer}>
      <TouchableOpacity
        style={[styles.alertItem, !item.read && styles.unreadAlert]}
        onPress={() => {
          if (item.id) {
            router.push(`/alert-detail/${item.id}`);
          }
        }}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text style={styles.alertDate}>{formatRelativeDate(item.date)}</Text>
        </View>
        <Text style={styles.alertMessage}>{item.message}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => item.id && handleDelete(item.id)}>
        <Ionicons name="trash-bin-outline" size={24} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Historique des alertes"
        subtitle="Consultez l'historique complet"
        showIcons={true}
        notificationCount={unreadCount}
        onDeleteAll={handleClearAll}
      />
      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id?.toString() ?? item.date}
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
    flex: 1,
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
  },
  alertItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  deleteButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 50,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  }
});
