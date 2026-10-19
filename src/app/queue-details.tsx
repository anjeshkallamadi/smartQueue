
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import styles from "../../styles/queueDetailsStyles";
import {
  formatQueueToken,
  getMyActiveQueueEntry,
  getSupabaseQueue,
  joinSupabaseQueue,
} from "../services/supabaseQueueService";

type MyEntry = {
  id: string;
  queue_id: string;
  token_number: number;
  status: string;
  joined_at: string;
};

export default function QueueDetails() {
  const { queueId, serviceName, description } =
    useLocalSearchParams<{
      queueId?: string;
      serviceName?: string;
      description?: string;
    }>();

  const [entry, setEntry] = useState<MyEntry | null>(null);
  const [queueStatus, setQueueStatus] = useState("");
  const [averageMinutes, setAverageMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const joinInProgress = useRef(false);

  const loadDetails = useCallback(async () => {
    if (!queueId) {
      setMessage("No queue ID was provided.");
      setLoading(false);
      return;
    }

    try {
      setMessage(null);

      const [queue, myEntry] = await Promise.all([
        getSupabaseQueue(queueId),
        getMyActiveQueueEntry(queueId),
      ]);

      setQueueStatus(queue.status);
      setAverageMinutes(queue.average_service_time);
      setEntry(myEntry);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load queue details."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [queueId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadDetails();
    }, [loadDetails])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDetails();
  };

  const handleJoin = async () => {
    if (!queueId || joinInProgress.current) return;

    joinInProgress.current = true;
    setJoining(true);
    setMessage(null);

    try {
      const result = await joinSupabaseQueue(queueId);

      setEntry({
        id: result.entry_id,
        queue_id: result.queue_id,
        token_number: result.token_number,
        status: result.entry_status,
        joined_at: new Date().toISOString(),
      });

      setMessage(
        `Joined successfully! People ahead when joined: ${result.people_ahead}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to join the queue."
      );
    } finally {
      joinInProgress.current = false;
      setJoining(false);
    }
  };

  const buttonDisabled =
    loading || joining || Boolean(entry) || queueStatus !== "active";

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
      <Text style={styles.serviceName}>
        {serviceName ?? "Service"}
      </Text>

      <Text style={styles.description}>
        {description ?? "View queue information and join remotely."}
      </Text>

      <Text style={styles.sectionTitle}>Current Queue</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Queue status</Text>
          <Text style={styles.infoValue}>
            {queueStatus || "Loading..."}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Now serving</Text>
          <Text style={styles.infoValue}>Not available yet</Text>
        </View>

        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.infoLabel}>Average service time</Text>
          <Text style={styles.infoValue}>
            {averageMinutes == null
              ? "Not available"
              : `${averageMinutes} min`}
          </Text>
        </View>
      </View>

      {loading && <ActivityIndicator size="large" />}

      <Pressable
        style={[
          styles.joinButton,
          buttonDisabled && styles.joinButtonDisabled,
        ]}
        onPress={handleJoin}
        disabled={buttonDisabled}
      >
        <Text style={styles.joinButtonText}>
          {loading
            ? "Loading..."
            : joining
              ? "Joining..."
              : entry
                ? "Already Joined"
                : queueStatus !== "active"
                  ? "Queue Unavailable"
                  : "Join Queue"}
        </Text>
      </Pressable>

      {message && (
        <Text style={styles.message}>{message}</Text>
      )}

      {entry && (
        <View style={styles.resultCard}>
          <Text style={styles.tokenLabel}>Your Token</Text>

          <Text style={styles.token}>
            {formatQueueToken(entry.token_number)}
          </Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Status</Text>
            <Text style={styles.resultValue}>
              {entry.status}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>People Ahead</Text>
            <Text style={styles.resultValue}>
              Position refresh coming next
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Estimated Wait</Text>
            <Text style={styles.resultValue}>
              Not available yet
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
