
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import {
  getMyQueueHistory,
  type MyQueueHistoryEntry,
} from "../services/supabaseQueueService";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string): string {
  const readable = status.replace(/[_-]/g, " ").trim();

  if (!readable) return "Unknown";

  return readable.replace(/\b\w/g, (character) =>
    character.toUpperCase()
  );
}

export default function QueueHistoryScreen() {
  const [history, setHistory] = useState<MyQueueHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const entries = await getMyQueueHistory();
      setHistory(entries);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load queue history. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadHistory(true)}
        />
      }
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.title}>Queue History</Text>
      </View>

      <Text style={styles.subtitle}>
        View your previous queue visits and token details.
      </Text>

      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.stateText}>
            Loading your queue history...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorTitle}>
            Unable to load history
          </Text>
          <Text style={styles.stateText}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => void loadHistory()}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.emptyTitle}>
            No queue history yet
          </Text>
          <Text style={styles.stateText}>
            Your previous queue visits will appear here after your
            queue entry is no longer active.
          </Text>
        </View>
      ) : (
        history.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>
                  {entry.serviceName}
                </Text>
                <Text style={styles.date}>
                  Joined {formatDate(entry.joinedAt)}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {formatStatus(entry.status)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Token number</Text>
              <Text style={styles.token}>
                {entry.tokenNumber === null
                  ? "Not assigned"
                  : "A" + String(entry.tokenNumber).padStart(3, "0")}
              </Text>
            </View>

            {entry.servedAt ? (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Served at</Text>
                <Text style={styles.value}>
                  {formatDate(entry.servedAt)}
                </Text>
              </View>
            ) : null}
          </View>
        ))
      )}

      <Text style={styles.footer}>
        Pull down to refresh your history.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backText: {
    color: "#111827",
    fontSize: 30,
    lineHeight: 34,
  },
  title: {
    color: "#111827",
    fontSize: 23,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },
  stateContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stateText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorTitle: {
    color: "#B91C1C",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  date: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  statusBadge: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 8,
    maxWidth: 120,
  },
  statusText: {
    color: "#3730A3",
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  label: {
    color: "#6B7280",
    fontSize: 14,
  },
  value: {
    flex: 1,
    color: "#111827",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "right",
  },
  token: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "700",
  },
  footer: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
