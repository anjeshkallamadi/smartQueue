
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
  getMyQueuePosition,
  getNowServingToken,
  getSupabaseQueue,
  joinSupabaseQueue
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
  const [averageMinutes, setAverageMinutes] =
    useState<number | null>(null);

  const [peopleAhead, setPeopleAhead] =
    useState<number | null>(null);

  const [nowServing, setNowServing] =
  useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [positionError, setPositionError] =
    useState<string | null>(null);

  const joinInProgress = useRef(false);

  // Load queue information and the user's saved entry.
  const loadDetails = useCallback(async () => {
    if (!queueId) {
      setMessage("No queue ID was provided.");
      setEntry(null);
      setPeopleAhead(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setMessage(null);
      setPositionError(null);

      const [queue, myEntry, currentServing] =
        await Promise.all([
          getSupabaseQueue(queueId),
          getMyActiveQueueEntry(queueId),
          getNowServingToken(queueId),
      ]);

      setNowServing(currentServing);

      setQueueStatus(queue.status);
      setAverageMinutes(queue.average_service_time);
      setEntry(myEntry);
      setPeopleAhead(null);

      if (myEntry) {
        try {
          const position = await getMyQueuePosition(queueId);

          setPeopleAhead(position.people_ahead);

          setEntry({
            ...myEntry,
            status: position.entry_status,
            token_number: position.token_number,
          });
        } catch (error) {
          setPositionError(
            error instanceof Error
              ? error.message
              : "Unable to refresh queue position."
          );
        }
      }
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

  // Refresh whenever the screen becomes active.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadDetails();
    }, [loadDetails])
  );

  // Pull down to refresh queue position.
  const handleRefresh = async () => {
    if (refreshing || joining) return;

    setRefreshing(true);
    await loadDetails();
  };

  // Join the queue through the secure Supabase RPC.
  const handleJoin = async () => {
    if (
      !queueId ||
      joinInProgress.current ||
      joining ||
      entry
    ) {
      return;
    }

    joinInProgress.current = true;
    setJoining(true);
    setMessage(null);
    setPositionError(null);

    try {
      const result = await joinSupabaseQueue(queueId);

      setEntry({
        id: result.entry_id,
        queue_id: result.queue_id,
        token_number: result.token_number,
        status: result.entry_status,
        joined_at: new Date().toISOString(),
      });

      setPeopleAhead(result.people_ahead);

      setMessage("Successfully joined the queue!");
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

  const estimatedWait =
    peopleAhead !== null &&
    averageMinutes !== null &&
    averageMinutes > 0
      ? peopleAhead * averageMinutes
      : null;

  const buttonDisabled =
    loading ||
    joining ||
    Boolean(entry) ||
    queueStatus !== "active";

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
      {/* Service information */}
      <Text style={styles.serviceName}>
        {serviceName ?? "Service"}
      </Text>

      <Text style={styles.description}>
        {description ??
          "View queue information and join remotely."}
      </Text>

      {/* Current queue information */}
      <Text style={styles.sectionTitle}>
        Current Queue
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Queue Status
          </Text>

          <Text style={styles.infoValue}>
            {queueStatus || "Loading..."}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Now Serving
          </Text>

          <Text style={styles.infoValue}>
            {nowServing === null
            ? "None"
            : formatQueueToken(nowServing)}
          </Text>
        </View>

        <View
          style={[
            styles.infoRow,
            styles.infoRowLast,
          ]}
        >
          <Text style={styles.infoLabel}>
            Average Service Time
          </Text>

          <Text style={styles.infoValue}>
            {averageMinutes === null
              ? "Not available"
              : `${averageMinutes} min`}
          </Text>
        </View>
      </View>

      {/* Loading indicator */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />
      )}

      {/* Join queue button */}
      <Pressable
        style={[
          styles.joinButton,
          buttonDisabled &&
            styles.joinButtonDisabled,
        ]}
        onPress={handleJoin}
        disabled={buttonDisabled}
        accessibilityRole="button"
        accessibilityLabel="Join selected queue"
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

      {/* Success or error message */}
      {message && (
        <Text
          style={styles.message}
          accessibilityRole="alert"
        >
          {message}
        </Text>
      )}

      {/* User's active queue entry */}
      {entry && (
        <View style={styles.resultCard}>
          <Text style={styles.tokenLabel}>
            Your Token
          </Text>

          <Text style={styles.token}>
            {formatQueueToken(
              entry.token_number
            )}
          </Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              People Ahead
            </Text>

            <Text style={styles.resultValue}>
              {peopleAhead === null
                ? "Unavailable"
                : peopleAhead}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Estimated Wait
            </Text>

            <Text style={styles.resultValue}>
              {estimatedWait === null
                ? "Unavailable"
                : `${estimatedWait} min (approx.)`}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Status
            </Text>

            <Text style={styles.resultValue}>
              {entry.status}
            </Text>
          </View>

          {positionError && (
            <Text style={styles.message}>
              {positionError}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}
