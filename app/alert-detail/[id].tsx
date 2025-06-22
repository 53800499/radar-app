/** @format */
import Header from "@/components/Header";
import type { Alert } from "@/utils/database";
import { getAlertById, markAlertAsRead } from "@/utils/database";
import { saveMediaFromUrl } from "@/utils/fileManager";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import * as Animatable from "react-native-animatable";

const { width } = Dimensions.get("window");

/* interface Alert {
  id: number;
  type: string;
  message: string;
  date: string;
  videoUri?: string;
  screenshotUri?: string;
} */

export default function AlertDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLocalUri, setVideoLocalUri] = useState<string | null>(null);
  const [screenshotLocalUri, setScreenshotLocalUri] = useState<string | null>(
    null
  );
  const [player, setPlayer] = useState<any>(null);

  // Initialiser le lecteur vidéo
  const videoPlayer = useVideoPlayer(videoLocalUri || "", (player) => {
    if (player) {
      player.loop = true;
      player.play();
    }
  });

  useEffect(() => {
    if (videoPlayer) {
      setPlayer(videoPlayer);
    }
  }, [videoPlayer]);

  useEffect(() => {
    const fetchAlertDetails = async () => {
      if (id) {
        try {
          setLoading(true);
          const fetchedAlert = await getAlertById(Number(id));
          if (!fetchedAlert) {
            setAlert(null);
            setVideoLocalUri(null);
            setScreenshotLocalUri(null);
            return;
          }

          setAlert(fetchedAlert);

          // Marquer l'alerte comme lue
          if (!fetchedAlert.read) {
            await markAlertAsRead(Number(id));
          }

          // Gérer la vidéo
          if (fetchedAlert.videoUri) {
            let localVideoPath = fetchedAlert.videoUri;
            if (
              !fetchedAlert.videoUri.startsWith(FileSystem.documentDirectory)
            ) {
              const fileName = `video_${fetchedAlert.id}.mp4`;
              localVideoPath = await saveMediaFromUrl(
                fetchedAlert.videoUri + "?alt=media",
                fileName
              );
            }
            setVideoLocalUri(localVideoPath);
          }

          // Gérer la capture d'écran
          if (fetchedAlert.screenshotUri) {
            let localScreenshotPath = fetchedAlert.screenshotUri;
            if (
              !fetchedAlert.screenshotUri.startsWith(
                FileSystem.documentDirectory
              )
            ) {
              const fileName = `screenshot_${fetchedAlert.id}.png`;
              localScreenshotPath = await saveMediaFromUrl(
                fetchedAlert.screenshotUri + "?alt=media",
                fileName
              );
            }
            setScreenshotLocalUri(localScreenshotPath);
          }
        } catch (error) {
          console.error(
            "Failed to fetch alert details or download media:",
            error
          );
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAlertDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header
          title="Chargement..."
          showIcons={true}
          titleAlign="flex-start"
        />
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header
          title="Alerte introuvable"
          showIcons={true}
          titleAlign="flex-start"
        />
        <Text style={styles.empty}>Alerte non trouvée.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Détails de l'alerte"
        showIcons={false}
        titleAlign="flex-start"
        leftContent={
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
        }
      />
      <Animatable.View
        animation="fadeInUp"
        delay={100}
        duration={400}
        style={styles.detailCard}>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.date}>{alert.date}</Text>

        <View style={styles.typeContainer}>
          <Ionicons
            name={
              alert.type === "présence"
                ? "walk-outline"
                : alert.type === "caméra"
                ? "videocam-outline"
                : "alert-circle-outline"
            }
            size={24}
            color={alert.type === "alerte" ? "#e74c3c" : "#3498db"}
          />
          <Text style={styles.typeText}>{alert.type}</Text>
        </View>

        {/* Vidéo */}
        {player ? (
          <View style={styles.videoContainer}>
            <VideoView
              player={player}
              style={styles.videoPlayer}
              allowsFullscreen
              allowsPictureInPicture
            />
          </View>
        ) : (
          <Text style={styles.noMediaText}>Aucune vidéo disponible.</Text>
        )}

        {/* Capture d&apos;écran */}
        {screenshotLocalUri ? (
          <Image
            source={{ uri: screenshotLocalUri }}
            style={styles.screenshotImage}
            resizeMode="contain"
            accessibilityLabel="Capture d'écran de l'alerte"
          />
        ) : (
          <Text style={styles.noMediaText}>
            Aucune capture d&apos;écran disponible.
          </Text>
        )}
      </Animatable.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8EBF1FF",
    borderRadius: 20
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10
  },
  date: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 15
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  typeText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#34495e"
  },
  videoContainer: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden"
  },
  videoPlayer: {
    width: "100%",
    height: "100%"
  },
  screenshotImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20
  },
  noMediaText: {
    textAlign: "center",
    color: "#95a5a6",
    fontSize: 16,
    marginVertical: 20
  },
  empty: {
    textAlign: "center",
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 20
  }
});
