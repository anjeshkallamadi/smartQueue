
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
  adminPauseQueue,
  adminResumeQueue,
  adminSkipCurrent,
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
        err instanceof Error
          ? err.message
          : "Unable to load queues."
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
    if (busyQueueId !== null) return;

    Alert.alert(
      "Call Next Token",
      `Call the next waiting token for ${queue.service_name}? The currently called token, if any, will be marked completed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Next",
          onPress: async () => {
            if (busyQueueId !== null) return;
            setBusyQueueId(queue.queue_id);

            try {
              const result = await adminCallNext(queue.queue_id);
              await loadQueues();

              Alert.alert(
                result ? "Token Called" : "No Waiting Tokens",
                result
                  ? `Now serving A${String(
                      result.token_number
                    ).padStart(3, "0")}`
                  : "No waiting customers remain."
              );
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

  const handleSkipToken = (queue: ManagedQueue) => {
    if (busyQueueId !== null || queue.called_token === null) {
      return;
    }

    Alert.alert(
      "Skip Current Token",
      `Skip token A${String(queue.called_token).padStart(
        3,
        "0"
      )} for ${queue.service_name}?\n\nThe next waiting token will NOT be called automatically.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip Token",
          style: "destructive",
          onPress: async () => {
            if (busyQueueId !== null) return;
            setBusyQueueId(queue.queue_id);

            try {
              const skippedToken = await adminSkipCurrent(
                queue.queue_id
              );
              await loadQueues();

              Alert.alert(
                skippedToken !== null
                  ? "Token Skipped"
                  : "No Active Token",
                skippedToken !== null
                  ? `A${String(skippedToken).padStart(
                      3,
                      "0"
                    )} was skipped. Press Call Next when ready.`
                  : "No token is currently being served."
              );
            } catch (err) {
              Alert.alert(
                "Skip Failed",
                err instanceof Error
                  ? err.message
                  : "Unable to skip the current token."
              );
            } finally {
              setBusyQueueId(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleQueue = (queue: ManagedQueue) => {
    if (busyQueueId !== null) return;

    const isPaused = queue.queue_status === "paused";
    const action = isPaused ? "Resume" : "Pause";

    Alert.alert(
      `${action} Queue`,
      isPaused
        ? `Resume ${queue.service_name}? Customers can join and queue operations will be enabled.`
        : `Pause ${queue.service_name}? New joins and token operations will be temporarily disabled. Existing tokens will be preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action,
          onPress: async () => {
            if (busyQueueId !== null) return;
            setBusyQueueId(queue.queue_id);

            try {
              if (isPaused) {
                await adminResumeQueue(queue.queue_id);
              } else {
                await adminPauseQueue(queue.queue_id);
              }

              await loadQueues();

              Alert.alert(
                isPaused ? "Queue Resumed" : "Queue Paused",
                `${queue.service_name} is now ${
                  isPaused ? "active" : "paused"
                }.`
              );
            } catch (err) {
              Alert.alert(
                `${action} Failed`,
                err instanceof Error
                  ? err.message
                  : "Unable to update queue status."
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
        queues.map((queue) => {
          const isBusy = busyQueueId !== null;
          const isActive = queue.queue_status === "active";
          const isPaused = queue.queue_status === "paused";

          const canCallNext = isActive && !isBusy;

          const canSkip =
            isActive &&
            queue.called_token !== null &&
            !isBusy;

          const canToggle =
            (isActive || isPaused) && !isBusy;

          return (
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
                  : `A${String(queue.called_token).padStart(
                      3,
                      "0"
                    )}`}
              </Text>

              <Text style={styles.detail}>
                Waiting Customers: {queue.waiting_count}
              </Text>

              <View style={styles.buttonRow}>
                <Pressable
                  accessibilityRole="button"
                  style={[
                    styles.button,
                    styles.callButton,
                    !canCallNext && styles.disabled,
                  ]}
                  disabled={!canCallNext}
                  onPress={() => handleCallNext(queue)}
                >
                  <Text style={styles.buttonText}>
                    {busyQueueId === queue.queue_id
                      ? "Processing..."
                      : "Call Next"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  style={[
                    styles.button,
                    styles.skipButton,
                    !canSkip && styles.disabled,
                  ]}
                  disabled={!canSkip}
                  onPress={() => handleSkipToken(queue)}
                >
                  <Text style={styles.buttonText}>
                    {busyQueueId === queue.queue_id
                      ? "Processing..."
                      : "Skip Token"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                style={[
                  styles.toggleButton,
                  isPaused
                    ? styles.resumeButton
                    : styles.pauseButton,
                  !canToggle && styles.disabled,
                ]}
                disabled={!canToggle}
                onPress={() => handleToggleQueue(queue)}
              >
                <Text style={styles.buttonText}>
                  {busyQueueId === queue.queue_id
                    ? "Processing..."
                    : isPaused
                    ? "Resume Queue"
                    : "Pause Queue"}
                </Text>
              </Pressable>

              <Text style={styles.helperText}>
                Skip does not call the next token.
                Pausing preserves all existing tokens.
              </Text>
            </View>
          );
        })}
    </ScrollView>
  );
}
