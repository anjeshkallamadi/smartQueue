import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import styles from "../../styles/scanServiceStyles";
import {
  findActiveQueueForService, parseServiceQrValue,
} from "../services/serviceManagementService";

export default function ScanService() {
  const [permission, requestPermission] = useCameraPermissions();
  const [resolving, setResolving] = useState(false);
  const locked = useRef(false);

  useFocusEffect(useCallback(() => {
    locked.current = false;
    return () => { locked.current = true; };
  }, []));

  const onScanned = async (event: BarcodeScanningResult) => {
    if (locked.current) return;
    locked.current = true;
    setResolving(true);
    const serviceId = parseServiceQrValue(event.data);
    if (!serviceId) {
      Alert.alert("Not a SmartQueue code",
        "Scan a QR code generated from the SmartQueue Admin Dashboard.",
        [{ text: "Try Again", onPress: () => {
          locked.current = false;
          setResolving(false);
        } }]);
      return;
    }
    try {
      const destination = await findActiveQueueForService(serviceId);
      router.replace({
        pathname: "/queue-details",
        params: destination,
      });
    } catch (error) {
      Alert.alert(
        "Cannot open queue",
        error instanceof Error ? error.message : "Please try again.",
        [{ text: "Try Again", onPress: () => {
          locked.current = false;
          setResolving(false);
        } }]
      );
    }
  };

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.help}>Allow camera permission to scan your service's QR code.</Text>
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
      <Text style={styles.help}>Point your camera at a SmartQueue service code.</Text>
      <View style={styles.cameraFrame}>
        <CameraView style={styles.camera} facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={resolving ? undefined : (result) => void onScanned(result)} />
        <View pointerEvents="none" style={styles.scanBorder} />
      </View>
      {resolving && <ActivityIndicator size="large" color="#2563EB" />}
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Cancel Scan</Text>
      </Pressable>
    </View>
  );
}
