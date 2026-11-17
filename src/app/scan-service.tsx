import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import styles from "../../styles/scanServiceStyles";
import {
  findActiveQueueForService,
  isValidServiceId,
  parseServiceQrValue,
  type ServiceQueueDestination,
} from "../services/serviceManagementService";
import { joinSupabaseQueue } from "../services/supabaseQueueService";

export default function ScanService() {
  const { serviceId, queueId } = useLocalSearchParams<{
    serviceId?: string;
    queueId?: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [resolving, setResolving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [verified, setVerified] = useState<ServiceQueueDestination | null>(null);
  const locked = useRef(false);
  const joiningRef = useRef(false);

  // Scanning must start from a selected queue, never the Home screen.
  const selectionValid =
    typeof serviceId === "string" &&
    isValidServiceId(serviceId) &&
    typeof queueId === "string" &&
    isValidServiceId(queueId);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
      return () => {
        locked.current = true;
      };
    }, [])
  );

  const showInvalidQR = () => {
    setResolving(false);
    Alert.alert(
      "Invalid QR",
      "This QR code does not match the selected service. Scan that service's QR code.",
      [{ text: "Try Again", onPress: () => { locked.current = false; } }]
    );
  };

  const onScanned = async (event: BarcodeScanningResult) => {
    if (locked.current || !selectionValid || verified) return;
    locked.current = true;
    setResolving(true);

    // Reject unrelated QR codes, including valid SmartQueue QR codes
    // for OTHER services. Never issue a token here.
    const scannedServiceId = parseServiceQrValue(event.data);
    if (!scannedServiceId || scannedServiceId !== serviceId.toLowerCase()) {
      showInvalidQR();
      return;
    }

    try {
      const destination = await findActiveQueueForService(scannedServiceId);
      // Check the actual current queue, not only the untrusted QR content.
      if (destination.queueId !== queueId) {
        showInvalidQR();
        return;
      }
      setVerified(destination);
    } catch (error) {
      setResolving(false);
      Alert.alert(
        "Queue unavailable",
        error instanceof Error ? error.message : "Cannot verify this service now.",
        [{ text: "Try Again", onPress: () => { locked.current = false; } }]
      );
    } finally {
      setResolving(false);
    }
  };

  const confirmJoin = async () => {
    if (!verified || !selectionValid || joiningRef.current) return;
    joiningRef.current = true;
    setJoining(true);
    try {
      // Recheck when the user confirms. The queue may have changed
      // between the scan and the confirmation.
      const current = await findActiveQueueForService(serviceId);
      if (current.queueId !== queueId || verified.queueId !== queueId) {
        setVerified(null);
        Alert.alert(
          "Queue changed",
          "The queue has changed. Please scan this service's QR again.",
          [{ text: "OK", onPress: () => { locked.current = false; } }]
        );
        return;
      }
      // The only join action in the user-facing mobile flow.
      await joinSupabaseQueue(current.queueId);
      router.replace({
        pathname: "/queue-details",
        params: {
          queueId: current.queueId,
          serviceName: current.serviceName,
          description: current.description,
        },
      });
    } catch (error) {
      Alert.alert(
        "Could not join queue",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      joiningRef.current = false;
      setJoining(false);
    }
  };

  if (!selectionValid) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Select a service first</Text>
        <Text style={styles.help}>
          Open Available Services, choose View Queue, then tap Scan Service QR.
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace("/home")}>
          <Text style={styles.buttonText}>View Services</Text>
        </Pressable>
      </View>
    );
  }

  // A successful scan is not a queue join. Explicit confirmation is required.
  if (verified) {
    return (
      <View style={styles.center}>
        <View style={styles.confirmCard}>
          <Text style={styles.verifiedTitle}>QR Verified</Text>
          <Text style={styles.verifiedService}>{verified.serviceName}</Text>
          <Text style={styles.help}>
            This QR matches your selected service. Confirm to join its active queue
            and receive your token.
          </Text>
          <Pressable
            style={[styles.button, joining && styles.disabledButton]}
            disabled={joining}
            accessibilityRole="button"
            onPress={() => void confirmJoin()}
          >
            {joining ? <ActivityIndicator color="#FFFFFF" /> : (
              <Text style={styles.buttonText}>Confirm Join Queue</Text>
            )}
          </Pressable>
          <Pressable disabled={joining} onPress={() => router.back()}>
            <Text style={styles.back}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.help}>
          Allow camera permission to scan the QR code for the selected service.
        </Text>
        <Pressable style={styles.button} onPress={() => void requestPermission()}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Scan Service QR</Text>
      <Text style={styles.help}>
        Scan the QR for the service you selected. Other QR codes will be rejected.
      </Text>
      <View style={styles.cameraFrame}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={resolving ? undefined : (result) => void onScanned(result)}
        />
        <View pointerEvents="none" style={styles.scanBorder} />
      </View>
      {resolving && <ActivityIndicator size="large" color="#2563EB" />}
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Cancel Scan</Text>
      </Pressable>
    </View>
  );
}
