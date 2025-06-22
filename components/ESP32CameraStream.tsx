/** @format */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";

interface ESP32CameraStreamProps {
  ipAddress: string;
  port?: number;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export const ESP32CameraStream: React.FC<ESP32CameraStreamProps> = ({
  ipAddress,
  port = 81,
  onError,
  onLoad
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const streamUrl = `http://${ipAddress}:${port}/stream`;

  useEffect(() => {
    // Réinitialiser l'état quand l'adresse IP change
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
  }, [ipAddress]);

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log("Stream error:", nativeEvent);

    if (retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      setTimeout(() => {
        setIsLoading(true);
        setHasError(false);
      }, 2000);
    } else {
      setHasError(true);
      setIsLoading(false);
      onError?.(
        `Erreur de connexion: ${
          nativeEvent.description || "Impossible de se connecter à la caméra"
        }`
      );
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
    onLoad?.();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>
            {retryCount > 0
              ? `Tentative de reconnexion (${retryCount}/3)...`
              : "Connexion à la caméra..."}
          </Text>
        </View>
      )}
      {!hasError && (
        <>
          <WebView
            source={{ uri: streamUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            injectedJavaScript={injectedJavaScript}
            onMessage={(event) => {
              if (event.nativeEvent.data === "stream-loaded") {
                handleLoad();
              }
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log(
                "ESP32CameraStream: Erreur de chargement",
                nativeEvent
              );
              handleError(syntheticEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log("ESP32CameraStream: Erreur HTTP", nativeEvent);
              handleError(syntheticEvent);
            }}
            originWhitelist={["*"]}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            cacheEnabled={false}
            incognito={true}
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}
            renderLoading={() => <View />}
          />
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={toggleFullscreen}>
            <Ionicons
              name={isFullscreen ? "contract" : "expand"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.7,
    backgroundColor: "#000",
    borderRadius: 20,
    overflow: "hidden"
  },
  fullscreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    zIndex: 1000,
    borderRadius: 0
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
  fullscreenButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
    borderRadius: 20
  }
});
