/** @format */

import { getUnreadAlertsCount } from "@/utils/database";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

export const useUnreadAlerts = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const updateUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadAlertsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du nombre d'alertes:", error);
    }
  }, []);

  // Mettre à jour au montage du composant
  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);

  // Mettre à jour quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      updateUnreadCount();
    }, [updateUnreadCount])
  );

  return {
    unreadCount,
    updateUnreadCount
  };
}; 