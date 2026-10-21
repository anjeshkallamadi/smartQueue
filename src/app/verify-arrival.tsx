import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";

import { verifySupabaseQueueArrival } from "../services/supabaseQueueService";

type CheckinPayload = {
  type?: string;
  queueId?: string;
  code?: string;
};

export default function VerifyArrivalScreen() {
  const params = useLocalSearchParams<{
    queueId?: string | string[];
    serviceName?: string | string[];
  }>();
  const queueId = Array.isArray(params.queueId)
    ? params.queueId[0]
    : params.queueId;
  const serviceName = Array.isArray(params.serviceName)
    ? params.serviceName[0]
    : params.serviceName;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanLock = useRef(false);

  async function handleBarcodeScanned(result: { data: string }) {
    if (scanLock.current || verifying) return;

    scanLock.current = true;
    setScanned(true);
    setVerifying(true);
    setError(null);

    try {
      let payload: CheckinPayload;

      try {
        payload = JSON.parse(result.data) as CheckinPayload;
      } catch {
        throw new Error(
          "This is not a SmartQueue check-in QR code. Scan the current QR displayed by the service."
        );
      }

      if (
        payload.type !== "smartqueue-checkin" ||
        !payload.queueId ||
        !payload.code
      ) {
        throw new Error("The scanned QR code is not a valid SmartQueue check-in code.");
      }

      if (queueId && payload.queueId !== queueId) {
        throw new Error("This QR code belongs to a different service.");
      }

      if (!payload.queueId) {
        throw new Error("The service ID is missing. Return to the queue and try again.");
      }

      const verified = await verifySupabaseQueueArrival(
        payload.queueId,
        payload.code
      );

      const tokenMessage =
        verified.token_number === null
          ? "Your arrival was verified. Status: " + verified.entry_status + "."
          : "Token A" +
            String(verified.token_number).padStart(3, "0") +
            " is now " +
            verified.entry_status +
            ".";

      Alert.alert(
        "Arrival verified",
        tokenMessage + " You can return to your queue details.",
        [
          {
            text: "Continue",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to verify your arrival. Please try again.";

      setError(message);
      setScanned(false);
      scanLock.current = false;
    } finally {
      setVerifying(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Verify Arrival</Text>
          <Text style={styles.subtitle}>
            {serviceName || "Selected service"}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Scan the on-site QR code</Text>
        <Text style={styles.description}>
          Be physically present at the selected service. Scan the current QR code shown by the service staff to activate your token.
        </Text>
      </View>

      {!queueId ? (
        <View style={styles.messageCard}>
          <Text style={styles.errorText}>
            No queue was selected. Return to Queue Details and try again.
          </Text>
        </View>
      ) : !permission ? (
        <View style={styles.cameraPlaceholder}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.description}>Checking camera permission...</Text>
        </View>
      ) : !permission.granted ? (
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.infoTitle}>Camera access is required</Text>
          <Text style={styles.description}>
            SmartQueue uses your camera only to scan the service check-in QR code.
          </Text>
          <Pressable
            style={styles.primaryButton}
            accessibilityRole="button"
            onPress={() => void requestPermission()}
          >
            <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraFrame}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              scanned || verifying
                ? undefined
                : handleBarcodeScanned
            }
          />
          <View pointerEvents="none" style={styles.scanOverlay}>
            <View style={styles.scanTarget} />
          </View>
          {verifying && (
            <View style={styles.verifyingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.verifyingText}>Verifying QR code...</Text>
            </View>
          )}
        </View>
      )}

      {error && (
        <View style={styles.messageCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.secondaryButton}
            disabled={verifying}
            onPress={() => {
              setError(null);
              setScanned(false);
              scanLock.current = false;
            }}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Scan Again</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.footer}>
        If your device camera is unavailable, ask authorized staff to verify your arrival from the admin dashboard.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backText: {
    color: "#111827",
    fontSize: 30,
    lineHeight: 34,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: "#111827",
    fontSize: 23,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 4,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  cameraFrame: {
    height: 360,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  scanTarget: {
    width: 230,
    height: 230,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,24,39,0.68)",
  },
  verifyingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  cameraPlaceholder: {
    minHeight: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#1D4ED8",
    fontWeight: "700",
  },
  footer: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 18,
  },
});
