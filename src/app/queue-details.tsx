
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [averageMinutes, setAverageMinutes] =
    useState<number | null>(null);
  const [peopleAhead, setPeopleAhead] =
    useState<number | null>(null);
  const [nowServing, setNowServing] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [positionError, setPositionError] =
    useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!queueId) {
      setMessage("No queue ID was provided.");
      setEntry(null);
      setSelectedServiceId(null);
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
      setSelectedServiceId(queue.service_id);
      setAverageMinutes(queue.average_service_time);
      setNowServing(currentServing);
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
    if (refreshing) return;

    setRefreshing(true);
    await loadDetails();
  };

  const estimatedWait =
    peopleAhead !== null &&
    averageMinutes !== null &&
    averageMinutes > 0
      ? peopleAhead * averageMinutes
      : null;

  const scanDisabled =
    loading ||
    Boolean(entry) ||
    !selectedServiceId ||
    queueStatus !== "active";

  const openServiceScanner = () => {
    if (scanDisabled || !queueId || !selectedServiceId) return;
    router.push({
      pathname: "/scan-service",
      params: { serviceId: selectedServiceId, queueId },
    });
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
          scanDisabled &&
            styles.joinButtonDisabled,
        ]}
        onPress={openServiceScanner}
        disabled={scanDisabled}
        accessibilityRole="button"
        accessibilityLabel="Scan the selected service QR code to join"
      >
        <Text style={styles.joinButtonText}>
          {loading
            ? "Loading..."
            : entry
              ? "Already Joined"
              : queueStatus !== "active"
                ? "Queue Unavailable"
                : "Scan Service QR"}
        </Text>
      </Pressable>
      {!entry && queueStatus === "active" && (
        <Text style={styles.message}>
          Scan the QR code for this service, then confirm to receive your token.
        </Text>
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
            {formatQueueToken(entry.token_number)}
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
