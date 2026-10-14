
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import styles from "../../styles/queueDetailsStyles";
import { getCurrentUserId } from "../lib/authService";

import {
  getQueue,
  joinQueue,
  getPeopleAhead,
  getEstimatedWaitTime,
  getQueueStatus,
  type QueueEntry,
} from "../services/queueService";

export default function QueueDetails() {
  const { queueId, serviceName, description } =
    useLocalSearchParams<{
      queueId?: string;
      serviceName?: string;
      description?: string;
    }>();

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const [queueEntries, setQueueEntries] =
    useState<QueueEntry[]>([]);

  const [joinedEntry, setJoinedEntry] =
    useState<QueueEntry | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  // A ref prevents rapid taps before React updates the button.
  const joinInProgress = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadQueueDetails() {
      setAuthLoading(true);
      setMessage(null);
      setCurrentUserId(null);
      setJoinedEntry(null);
      setQueueEntries([]);

      if (!queueId?.trim()) {
        setMessage(
          "This service has no queue ID. Return to Home and select a service."
        );
        setAuthLoading(false);
        return;
      }

      try {
        const userId = await getCurrentUserId();

        if (!active) return;

        setCurrentUserId(userId);

        const entries = getQueue(queueId);
        setQueueEntries(entries);

        if (!userId) {
          setMessage("Please log in to join this queue.");
          return;
        }

        // Reuse an existing active entry if the user returns here.
        const existingEntry =
          entries.find((entry) => entry.userId === userId) ?? null;

        setJoinedEntry(existingEntry);
      } catch {
        if (active) {
          setMessage(
            "Unable to load your account. Please try again."
          );
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void loadQueueDetails();

    return () => {
      active = false;
    };
  }, [queueId]);

  const handleJoinQueue = async () => {
    if (joinInProgress.current || isJoining) return;

    if (!queueId?.trim()) {
      setMessage("Please return to Home and select a service.");
      return;
    }

    joinInProgress.current = true;
    setIsJoining(true);
    setMessage(null);

    try {
      // Resolve the current session when the user presses Join.
      const userId = await getCurrentUserId();

      if (!userId) {
        setCurrentUserId(null);
        setMessage("Please log in before joining a queue.");

        Alert.alert(
          "Login Required",
          "Please log in first, then return to this service."
        );
        return;
      }

      setCurrentUserId(userId);

      // The service itself also prevents duplicate active entries.
      const entry = joinQueue(queueId, userId);

      setJoinedEntry(entry);
      setQueueEntries(getQueue(queueId));
      setMessage(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Please try again.";

      setMessage(`Unable to join the queue. ${errorMessage}`);
    } finally {
      joinInProgress.current = false;
      setIsJoining(false);
    }
  };

  const peopleAhead =
    joinedEntry && currentUserId && queueId
      ? getPeopleAhead(queueId, currentUserId)
      : null;

  const estimatedWait =
    joinedEntry && currentUserId && queueId
      ? getEstimatedWaitTime(queueId, currentUserId)
      : null;

  const status =
    joinedEntry && currentUserId && queueId
      ? getQueueStatus(queueId, currentUserId)
      : null;

  const nowServing = queueEntries[0]?.token ?? "—";

  const buttonDisabled =
    authLoading || isJoining || Boolean(joinedEntry) || !queueId;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
          <Text style={styles.infoLabel}>Now serving</Text>
          <Text style={styles.infoValue}>{nowServing}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>People in queue</Text>
          <Text style={styles.infoValue}>
            {queueEntries.length}
          </Text>
        </View>

        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.infoLabel}>
            Average service time
          </Text>
          <Text style={styles.infoValue}>5 min</Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.joinButton,
          buttonDisabled && styles.joinButtonDisabled,
        ]}
        onPress={handleJoinQueue}
        disabled={buttonDisabled}
        accessibilityRole="button"
        accessibilityLabel="Join selected service queue"
      >
        <Text style={styles.joinButtonText}>
          {authLoading
            ? "Checking account..."
            : isJoining
              ? "Joining..."
              : joinedEntry
                ? "Already Joined"
                : "Join Queue"}
        </Text>
      </Pressable>

      {message && (
        <Text style={styles.message} accessibilityRole="alert">
          {message}
        </Text>
      )}

      {joinedEntry && (
        <View style={styles.resultCard}>
          <Text style={styles.tokenLabel}>Your Token</Text>

          <Text style={styles.token}>
            {joinedEntry.token}
          </Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>People Ahead</Text>
            <Text style={styles.resultValue}>
              {peopleAhead}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Estimated Wait</Text>
            <Text style={styles.resultValue}>
              {estimatedWait} min
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Status</Text>
            <Text style={styles.resultValue}>{status}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
