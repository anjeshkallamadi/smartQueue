
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import QRCode from "react-native-qrcode-svg";
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
  adminCreateQueueCheckinCode,
  adminListPendingEntries,
  adminVerifyPendingEntry,
  adminRejectPendingEntry,
  adminMarkCurrentNoShow,
  adminCompleteCurrent,
  adminExpireNoShows,
  adminGetNoShowGrace,
  adminSetNoShowGrace,
  checkIsAdmin,
  getMyManagedQueues,
  type AdminPendingEntry,
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

      // Run the server-side no-show timeout check using each queue's configured grace period.
      const initialQueues = await getMyManagedQueues();
      await Promise.all(
        initialQueues.map((queue) => adminExpireNoShows(queue.queue_id))
      );

      const result = await getMyManagedQueues();
      const queuesWithPending = await Promise.all(
        result.map(async (queue) => {
          const [pendingEntries, graceMinutes] = await Promise.all([
            adminListPendingEntries(queue.queue_id),
            adminGetNoShowGrace(queue.queue_id),
          ]);

          return {
            ...queue,
            pending_entries: pendingEntries,
            checkin_code: null,
            checkin_expires_at: null,
            no_show_grace_minutes: graceMinutes,
          };
        })
      );
      setQueues(queuesWithPending);
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

  const handleSetNoShowGrace = async (
    queue: ManagedQueue,
    minutes: number
  ) => {
    if (busyQueueId !== null) return;
    if (minutes < 1 || minutes > 30) return;

    setBusyQueueId(queue.queue_id);
    try {
      const savedMinutes = await adminSetNoShowGrace(queue.queue_id, minutes);
      setQueues((current) =>
        current.map((item) =>
          item.queue_id === queue.queue_id
            ? { ...item, no_show_grace_minutes: savedMinutes }
            : item
        )
      );
    } catch (err) {
      Alert.alert(
        "Unable to update grace period",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setBusyQueueId(null);
    }
  };

  const handleCreateCheckinQr = async (queue: ManagedQueue) => {
    if (busyQueueId !== null) return;
    setBusyQueueId(queue.queue_id);

    try {
      const result = await adminCreateQueueCheckinCode(queue.queue_id);
      setQueues((current) =>
        current.map((item) =>
          item.queue_id === queue.queue_id
            ? {
                ...item,
                checkin_code: result.checkin_code,
                checkin_expires_at: result.expires_at,
              }
            : item
        )
      );
      Alert.alert(
        "Check-in QR ready",
        "Display this QR at the service location. It expires in 5 minutes; generating another QR revokes the previous one."
      );
    } catch (err) {
      Alert.alert(
        "Unable to create QR",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setBusyQueueId(null);
    }
  };

  const handleVerifyArrivalManually = (
    queue: ManagedQueue,
    entry: AdminPendingEntry
  ) => {
    if (busyQueueId !== null) return;

    Alert.alert(
      "Verify arrival in person?",
      "Confirm that " +
        entry.customer_name +
        (entry.token_number === null
          ? " (token not assigned yet)"
          : " (token A" + String(entry.token_number).padStart(3, "0") + ")") +
        " is physically present at " +
        queue.service_name +
        ".",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify Arrival",
          onPress: async () => {
            if (busyQueueId !== null) return;
            setBusyQueueId(queue.queue_id);
            try {
              await adminVerifyPendingEntry(entry.entry_id);
              await loadQueues();
              Alert.alert("Arrival verified", "The token is now in the waiting queue.");
            } catch (err) {
              Alert.alert(
                "Verification failed",
                err instanceof Error ? err.message : "Please try again."
              );
            } finally {
              setBusyQueueId(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectPending = (
    queue: ManagedQueue,
    entry: AdminPendingEntry
  ) => {
    if (busyQueueId !== null) return;

    Alert.alert(
      "Reject token request?",
      "Reject the pending request from " +
        entry.customer_name +
        "? It will remain in the customer's history as rejected.",
      [
        { text: "Keep Request", style: "cancel" },
        {
          text: "Reject Request",
          style: "destructive",
          onPress: async () => {
            if (busyQueueId !== null) return;
            setBusyQueueId(queue.queue_id);
            try {
              await adminRejectPendingEntry(entry.entry_id);
              await loadQueues();
              Alert.alert("Request rejected", "The pending request was rejected.");
            } catch (err) {
              Alert.alert(
                "Reject failed",
                err instanceof Error ? err.message : "Please try again."
              );
            } finally {
              setBusyQueueId(null);
            }
          },
        },
      ]
    );
  };

  const handleMarkCurrentServed = (queue: ManagedQueue) => {
    if (busyQueueId !== null || queue.called_token === null) return;

    Alert.alert(
      "Mark current token as served?",
      "Confirm that token A" +
        String(queue.called_token).padStart(3, "0") +
        " has been served. It will be removed from the active queue.",
      [
        { text: "Keep Token", style: "cancel" },
        {
          text: "Mark Served",
          onPress: async () => {
            if (busyQueueId !== null) return;
            setBusyQueueId(queue.queue_id);
            try {
              const token = await adminCompleteCurrent(queue.queue_id);
              await loadQueues();
              Alert.alert(
                "Token completed",
                "Token A" + String(token).padStart(3, "0") + " was marked served."
              );
            } catch (err) {
              Alert.alert(
                "Unable to mark served",
                err instanceof Error ? err.message : "Please try again."
              );
            } finally {
              setBusyQueueId(null);
            }
          },
        },
      ]
    );
  };

  const handleMarkCurrentNoShow = (queue: ManagedQueue) => {
    if (busyQueueId !== null || queue.called_token === null) return;

    Alert.alert(
      "Mark current token as no-show?",
      "Mark token A" +
        String(queue.called_token).padStart(3, "0") +
        " as a no-show? This removes it from the active queue.",
      [
        { text: "Keep Token", style: "cancel" },
        {
          text: "Mark No-show",
          style: "destructive",
          onPress: async () => {
            if (busyQueueId !== null) return;
            setBusyQueueId(queue.queue_id);
            try {
              const token = await adminMarkCurrentNoShow(queue.queue_id);
              await loadQueues();
              Alert.alert(
                "Marked as no-show",
                "Token A" + String(token).padStart(3, "0") + " was removed from the active queue."
              );
            } catch (err) {
              Alert.alert(
                "Unable to mark no-show",
                err instanceof Error ? err.message : "Please try again."
              );
            } finally {
              setBusyQueueId(null);
            }
          },
        },
      ]
    );
  };

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
      "Call the next waiting token for " +
        queue.service_name +
        "? If a token is currently called, mark it Served or No-show first. Overdue calls are marked no-show automatically.",
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
              <Text style={styles.detail}>
                Pending Verification: {queue.pending_entries?.length ?? 0}
              </Text>

              <View style={{ marginTop: 6, marginBottom: 8 }}>
                <Text style={styles.detail}>
                  No-show grace period: {queue.no_show_grace_minutes ?? 3} minute(s)
                </Text>
                <View style={styles.buttonRow}>
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.button,
                      styles.skipButton,
                      (busyQueueId !== null || (queue.no_show_grace_minutes ?? 3) <= 1) && styles.disabled,
                    ]}
                    disabled={busyQueueId !== null || (queue.no_show_grace_minutes ?? 3) <= 1}
                    onPress={() => void handleSetNoShowGrace(
                      queue,
                      (queue.no_show_grace_minutes ?? 3) - 1
                    )}
                  >
                    <Text style={styles.buttonText}>− 1 minute</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.button,
                      styles.callButton,
                      (busyQueueId !== null || (queue.no_show_grace_minutes ?? 3) >= 30) && styles.disabled,
                    ]}
                    disabled={busyQueueId !== null || (queue.no_show_grace_minutes ?? 3) >= 30}
                    onPress={() => void handleSetNoShowGrace(
                      queue,
                      (queue.no_show_grace_minutes ?? 3) + 1
                    )}
                  >
                    <Text style={styles.buttonText}>+ 1 minute</Text>
                  </Pressable>
                </View>
                <Text style={styles.helperText}>
                  Range: 1–30 minutes. Expired calls are marked no-show when the dashboard refreshes or the next token is called.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                style={[
                  styles.toggleButton,
                  styles.callButton,
                  busyQueueId !== null && styles.disabled,
                ]}
                disabled={busyQueueId !== null}
                onPress={() => void handleCreateCheckinQr(queue)}
              >
                <Text style={styles.buttonText}>
                  {busyQueueId === queue.queue_id
                    ? "Processing..."
                    : "Generate / Refresh Check-in QR"}
                </Text>
              </Pressable>

              {queue.checkin_code && queue.checkin_expires_at && (
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: "#F9FAFB",
                    borderRadius: 12,
                    padding: 14,
                    marginTop: 12,
                    marginBottom: 12,
                  }}
                >
                  <QRCode
                    value={JSON.stringify({
                      type: "smartqueue-checkin",
                      queueId: queue.queue_id,
                      code: queue.checkin_code,
                    })}
                    size={190}
                    quietZone={10}
                  />
                  <Text style={styles.detail}>
                    Show this QR at the service location.
                  </Text>
                  <Text style={styles.helperText}>
                    Expires at {new Date(queue.checkin_expires_at).toLocaleTimeString()}.
                  </Text>
                </View>
              )}

              {(queue.pending_entries ?? []).length > 0 && (
                <View style={{ marginTop: 12, marginBottom: 12 }}>
                  <Text style={styles.detail}>Pending Arrival Requests</Text>
                  {(queue.pending_entries ?? []).map((entry) => (
                    <View
                      key={entry.entry_id}
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderColor: "#E5E7EB",
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        marginTop: 10,
                      }}
                    >
                      <Text style={styles.serviceName}>
                        {entry.customer_name}
                      </Text>
                      <Text style={styles.detail}>
                        {entry.token_number === null
                          ? "Token assigned after verification"
                          : "Token: A" + String(entry.token_number).padStart(3, "0")}
                      </Text>
                      <Text style={styles.helperText}>
                        Requested: {new Date(entry.joined_at).toLocaleString()}
                      </Text>
                      <View style={styles.buttonRow}>
                        <Pressable
                          accessibilityRole="button"
                          style={[
                            styles.button,
                            styles.callButton,
                            busyQueueId !== null && styles.disabled,
                          ]}
                          disabled={busyQueueId !== null}
                          onPress={() => handleVerifyArrivalManually(queue, entry)}
                        >
                          <Text style={styles.buttonText}>Verify In Person</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          style={[
                            styles.button,
                            styles.skipButton,
                            busyQueueId !== null && styles.disabled,
                          ]}
                          disabled={busyQueueId !== null}
                          onPress={() => handleRejectPending(queue, entry)}
                        >
                          <Text style={styles.buttonText}>Reject</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

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

              {queue.called_token !== null && (
                <>
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.toggleButton,
                      styles.callButton,
                      (busyQueueId !== null || !isActive) && styles.disabled,
                    ]}
                    disabled={busyQueueId !== null || !isActive}
                    onPress={() => handleMarkCurrentServed(queue)}
                  >
                    <Text style={styles.buttonText}>Mark Current as Served</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.toggleButton,
                      styles.skipButton,
                      (busyQueueId !== null || !isActive) && styles.disabled,
                    ]}
                    disabled={busyQueueId !== null || !isActive}
                    onPress={() => handleMarkCurrentNoShow(queue)}
                  >
                    <Text style={styles.buttonText}>Mark Current as No-show</Text>
                  </Pressable>
                </>
              )}

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
