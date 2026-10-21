
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import styles from "../../styles/queueDetailsStyles";
import { supabase } from "../lib/supabase";

import {
  formatQueueToken,
  getMyActiveQueueEntry,
  getMyQueuePosition,
  getNowServingToken,
  getSupabaseQueue,
  joinSupabaseQueue,
  cancelMyQueueEntry,
} from "../services/supabaseQueueService";

type MyEntry = {
  id: string;
  queue_id: string;
  token_number: number | null;
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
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [positionError, setPositionError] =
    useState<string | null>(null);

  const joinInProgress = useRef(false);

  const loadDetails = useCallback(async () => {
    if (!queueId) {
      setMessage("No queue ID was provided.");
      setEntry(null);
      setPeopleAhead(null);
      setNowServing(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setPositionError(null);

      const [queue, myEntry, currentServing] =
        await Promise.all([
          getSupabaseQueue(queueId),
          getMyActiveQueueEntry(queueId),
          getNowServingToken(queueId),
        ]);

      setQueueStatus(queue.status);
      setAverageMinutes(queue.average_service_time);
      setNowServing(currentServing);
      setEntry(myEntry);
      setPeopleAhead(null);

      if (myEntry && myEntry.status !== "pending_verification") {
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

  // Load data and subscribe to queue changes while
  // this screen is focused.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      void loadDetails();

      if (!queueId) {
        return () => {
          active = false;
        };
      }

      const channel = supabase
        .channel(`queue-updates-${queueId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "queues",
            filter: `id=eq.${queueId}`,
          },
          () => {
            if (active) {
              void loadDetails();
            }
          }
        )
        .subscribe((status) => {
          if (active && status === "SUBSCRIBED") {
            // Fetch again after connecting to avoid
            // missing changes during subscription setup.
            void loadDetails();
          }
        });

      return () => {
        active = false;

        // Disconnect when leaving the screen.
        void supabase.removeChannel(channel);
      };
    }, [queueId, loadDetails])
  );

  const handleRefresh = async () => {
    if (refreshing || joining) return;

    setRefreshing(true);
    await loadDetails();
  };

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
      setMessage(
        "Token request created. Scan the current QR code at the service location to activate your place in the queue."
      );

      // Synchronize after joining.
      await loadDetails();
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

  async function cancelCurrentEntry() {
    if (!queueId || cancelling) return;

    Alert.alert(
      "Cancel queue token?",
      "Your pending request or active queue place will be cancelled. You will need to join again to get another token.",
      [
        { text: "Keep Token", style: "cancel" },
        {
          text: "Cancel Token",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelMyQueueEntry(queueId);
              setEntry(null);
              setPeopleAhead(null);
              setMessage("Your queue entry has been cancelled.");
              await loadDetails();
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Unable to cancel your queue entry."
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }

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
      <Text style={styles.serviceName}>
        {serviceName ?? "Service"}
      </Text>

      <Text style={styles.description}>
        {description ??
          "View queue information and join remotely."}
      </Text>

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

      {loading && (
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />
      )}

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
                ? entry.status === "pending_verification"
                  ? "Verification Required"
                  : "Already Joined"
                : queueStatus !== "active"
                  ? "Queue Unavailable"
                  : "Join Queue"}
        </Text>
      </Pressable>

      {entry?.status === "pending_verification" && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Verify your arrival</Text>
          <Text style={styles.description}>
            Your token request does not occupy a waiting place yet. Be at the service location, scan its current SmartQueue QR code, or ask staff to verify your arrival.
          </Text>
          <Pressable
            style={styles.joinButton}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/verify-arrival",
                params: {
                  queueId,
                  serviceName: Array.isArray(serviceName)
                    ? serviceName[0]
                    : serviceName ?? "Service",
                },
              } as any)
            }
          >
            <Text style={styles.joinButtonText}>Scan Arrival QR Code</Text>
          </Pressable>
        </View>
      )}

      {entry && ["pending_verification", "waiting", "called"].includes(entry.status) && (
        <Pressable
          style={[styles.joinButton, cancelling && styles.joinButtonDisabled]}
          disabled={cancelling}
          accessibilityRole="button"
          onPress={cancelCurrentEntry}
        >
          <Text style={styles.joinButtonText}>
            {cancelling ? "Cancelling..." : "Cancel Queue Token"}
          </Text>
        </Pressable>
      )}

      {message && (
        <Text
          style={styles.message}
          accessibilityRole="alert"
        >
          {message}
        </Text>
      )}

      {entry && (
        <View style={styles.resultCard}>
          <Text style={styles.tokenLabel}>
            Your Token
          </Text>

          <Text style={styles.token}>
            {entry.token_number === null
              ? "Pending"
              : formatQueueToken(entry.token_number)}
          </Text>

          {entry.status === "pending_verification" && (
            <Text style={styles.message}>
              Pending arrival verification. This token is not counted in the waiting line until your arrival is confirmed.
            </Text>
          )}

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
