
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import styles from "../../styles/adminDashboardStyles";
import {
    adminCallNext,
    checkIsAdmin,
    getMyManagedQueues,
    type ManagedQueue,
} from "../services/adminQueueService";

export default function AdminDashboard() {
  const [queues, setQueues] = useState<ManagedQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busyQueueId, setBusyQueueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueues = useCallback(async () => {
    try {
      setError(null);

      const allowed = await checkIsAdmin();
      setIsAdmin(allowed);

      if (!allowed) {
        setQueues([]);
        return;
      }

      const result = await getMyManagedQueues();
      setQueues(result);
    } catch (err) {
      setQueues([]);
      setError(
        err instanceof Error ? err.message : "Unable to load queues."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadQueues();
    }, [loadQueues])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadQueues();
  };

  const handleCallNext = (queue: ManagedQueue) => {
    if (busyQueueId) return;

    Alert.alert(
      "Call Next Token",
      `Call the next waiting token for ${queue.service_name}? The currently called token, if any, will be marked completed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Next",
          onPress: async () => {
            setBusyQueueId(queue.queue_id);

            try {
              const result = await adminCallNext(queue.queue_id);

              Alert.alert(
                result ? "Token Called" : "No Waiting Tokens",
                result
                  ? `Now serving A${String(result.token_number).padStart(3, "0")}`
                  : "No waiting customers remain."
              );

              await loadQueues();
            } catch (err) {
              Alert.alert(
                "Operation Failed",
                err instanceof Error
                  ? err.message
                  : "Unable to call next token."
              );
            } finally {
              setBusyQueueId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>
        Manage queues belonging to your services.
      </Text>

      {loading && <ActivityIndicator size="large" />}

      {!loading && error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {!loading && !error && !isAdmin && (
        <Text style={styles.message}>
          Access denied. This dashboard is for service providers.
        </Text>
      )}

      {!loading && !error && isAdmin && queues.length === 0 && (
        <Text style={styles.message}>
          You do not own any service queues yet.
        </Text>
      )}

      {!loading &&
        !error &&
        isAdmin &&
        queues.map((queue) => (
          <View key={queue.queue_id} style={styles.card}>
            <Text style={styles.serviceName}>
              {queue.service_name}
            </Text>

            <Text style={styles.detail}>
              Queue Status: {queue.queue_status}
            </Text>

            <Text style={styles.detail}>
              Now Serving:{" "}
              {queue.called_token === null
                ? "None"
                : `A${String(queue.called_token).padStart(3, "0")}`}
            </Text>

            <Text style={styles.detail}>
              Waiting Customers: {queue.waiting_count}
            </Text>

            <Pressable
              style={[
                styles.button,
                (busyQueueId !== null ||
                  queue.queue_status !== "active") &&
                  styles.disabled,
              ]}
              disabled={
                busyQueueId !== null ||
                queue.queue_status !== "active"
              }
              onPress={() => handleCallNext(queue)}
            >
              <Text style={styles.buttonText}>
                {busyQueueId === queue.queue_id
                  ? "Processing..."
                  : "Call Next"}
              </Text>
            </Pressable>
          </View>
        ))}
    </ScrollView>
  );
}