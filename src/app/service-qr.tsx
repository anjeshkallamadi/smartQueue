import { router, useLocalSearchParams } from "expo-router";
import { Share, Pressable, ScrollView, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import styles from "../../styles/serviceQrStyles";
import {
  isValidServiceId, serviceQrValue,
} from "../services/serviceManagementService";

export default function ServiceQR() {
  const { serviceId, serviceName } = useLocalSearchParams<{
    serviceId?: string;
    serviceName?: string;
  }>();
  const valid = typeof serviceId === "string" && isValidServiceId(serviceId);
  const url = valid ? serviceQrValue(serviceId) : "";

  const shareCode = async () => {
    if (!url) return;
    await Share.share({
      message: (serviceName || "SmartQueue Service") +
        "\nOpen SmartQueue's Scan Service QR screen to scan this QR.\n" + url,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.replace("/admin-dashboard")}>
        <Text style={styles.back}>← Admin Dashboard</Text>
      </Pressable>
      <Text style={styles.heading}>{serviceName || "Service QR Code"}</Text>
      <Text style={styles.subtitle}>This QR belongs to this service permanently.</Text>
      {!valid ? (
        <View style={styles.card}>
          <Text style={styles.error}>Invalid service ID. Open this screen from your dashboard.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.qrCanvas}>
            <QRCode value={url} size={240} quietZone={8} ecl="M" />
          </View>
          <Text style={styles.scanTitle}>SCAN TO JOIN</Text>
          <Text style={styles.help}>
            Customers: log into SmartQueue, tap "Scan Service QR" on Home,
            then point your camera at this code to open the active queue.
          </Text>
          <Text selectable style={styles.id}>Service ID: {serviceId}</Text>
          <Pressable style={styles.primaryButton} onPress={() => void shareCode()}>
            <Text style={styles.primaryText}>Share Service Link</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton}
            onPress={() => router.replace("/admin-dashboard")}>
            <Text style={styles.secondaryText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
