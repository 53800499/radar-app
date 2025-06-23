/** @format */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";

export default function FullscreenScreen() {
  const { ipAddress } = useLocalSearchParams<{ ipAddress: string }>();
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  const handleScreenPress = () => {
    setShowControls(!showControls);
  };

  const handleBack = () => {
    router.back();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  const injectedJavaScript = `
    const img = document.querySelector('img');
    if (img) {
      img.onload = () => {
        window.ReactNativeWebView.postMessage('stream-loaded');
      };
      if (img.complete) {
        window.ReactNativeWebView.postMessage('stream-loaded');
      }
    }
  `;

  if (!ipAddress) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ea4335" />
          <Text style={styles.errorText}>Adresse IP manquante</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={handleScreenPress}>
        <WebView
          key={refreshKey}
          source={{ uri: `http://${ipAddress}:81/stream` }}
          style={styles.webview}
          injectedJavaScript={injectedJavaScript}
          onMessage={(event) => {
            if (event.nativeEvent.data === "stream-loaded") {
              setIsLoading(false);
            }
          }}
          onLoadStart={() => {
            console.log("WebView: Chargement démarré");
            setIsLoading(true);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.log("WebView: Erreur de chargement", nativeEvent);
            setIsLoading(false);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          onShouldStartLoadWithRequest={() => true}
          originWhitelist={["*"]}
          mixedContentMode="always"
          cacheEnabled={false}
          incognito={true}
          androidLayerType="hardware"
          androidHardwareAccelerationDisabled={false}
          renderLoading={() => <View />}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.loadingText}>Chargement du flux vidéo...</Text>
          </View>
        )}
      </TouchableOpacity>

      {showControls && (
        <View style={styles.controlsOverlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Surveillance en direct</Text>
          </View>

          <View style={styles.centerControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={togglePause}>
              <Ionicons
                name={isPaused ? "play" : "pause"}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
              <Ionicons
                name={isMuted ? "volume-mute" : "volume-high"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleRefresh}>
              <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.timestamp}>
              {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  videoContainer: {
    flex: 1,
    position: "relative"
  },
  webview: {
    flex: 1,
    backgroundColor: "#000"
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "space-between",
    padding: 20
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 20
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  },
  centerControls: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 40 : 20
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000"
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 20,
    textAlign: "center"
  },
  backButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16
  },
  timestamp: {
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4
  }
});
