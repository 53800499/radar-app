/** @format */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    //backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    //elevation: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "space-between"
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center"
  },
  titleContainer: {
    flex: 1,
    marginLeft: 10
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a73e8"
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  iconBackground: {
    backgroundColor: "rgba(26, 115, 232, 0.1)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center"
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center"
  },
  backIcon: {
    backgroundColor: "rgba(26, 115, 232, 0.1)",
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center"
  }
});

interface HeaderProps {
  title: string;
  subtitle?: string;
  showIcons?: boolean;
  showBackButton?: boolean;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  showIcons = true,
  showBackButton = false,
  leftContent,
  rightContent
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <View style={styles.backIcon}>
              <Ionicons name="arrow-back" size={22} color="#1a73e8" />
            </View>
          </TouchableOpacity>
        )}
        {leftContent}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.rightSection}>
        {showIcons && !rightContent && (
          <View style={styles.iconContainer}>
            <TouchableOpacity style={styles.iconBackground}>
              <Ionicons name="add-outline" size={20} color="#1a73e8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBackground}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#1a73e8"
              />
            </TouchableOpacity>
          </View>
        )}
        {rightContent}
      </View>
    </View>
  );
}
