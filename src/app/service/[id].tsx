import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import styles from "../../../styles/scanServiceStyles";
import { findActiveQueueForService } from "../../services/serviceManagementService";

export default function ServiceDeepLink() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof id !== "string") {
      setError("Invalid service QR.");
      return;
    }
    let active = true;
    void findActiveQueueForService(id).then((queue) => {
      if (!active) return;
      router.replace({ pathname: "/queue-details", params: queue });
    }).catch((e) => {
      if (active) setError(e instanceof Error ? e.message : "Unable to open service.");
    });
    return () => { active = false; };
  }, [id]);

  return (
    <View style={styles.center}>
      {error ? (
        <>
          <Text style={styles.title}>Unable to open service</Text>
          <Text style={styles.help}>{error}</Text>
          <Pressable style={styles.button} onPress={() => router.replace("/home")}>
            <Text style={styles.buttonText}>Go Home</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" />
          <Text style={styles.help}>Opening active service queue...</Text>
        </>
      )}
    </View>
  );
}
