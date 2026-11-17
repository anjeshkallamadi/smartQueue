import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import type { AppNotification } from "../services/notificationService";

const titles: Record<string, string> = {
  queue_joined: "Queue Joined Successfully",
  turn_approaching: "Your Turn Is Approaching",
  turn_called: "It's Your Turn!",
  queue_paused: "Queue Temporarily Paused",
  queue_resumed: "Queue Resumed",
  appointment_completed: "Appointment Completed",
  token_skipped: "Token Skipped",
};

// Mounted once in the root layout, keyed by the authenticated user's ID.
export default function NotificationPopup({ userId }: { userId: string }) {
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<AppNotification[]>([]);
  const current = pending[0];

  useEffect(() => {
    let disposed = false;
    let foreground = AppState.currentState === "active" || AppState.currentState === null;
    const seen = new Set<string>();
    const appStateListener = AppState.addEventListener("change", state => {
      foreground = state === "active";
      if (!foreground) setPending([]);
    });

    const channel = supabase
      .channel(`notification-popups:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        payload => {
          if (disposed || !foreground) return;
          const notification = payload.new as AppNotification;
          // RLS is the security boundary; this is an additional UI check.
          if (notification.user_id !== userId || !notification.id || notification.is_read || seen.has(notification.id)) return;
          seen.add(notification.id);
          if (seen.size > 500) {
            const oldest = seen.values().next().value;
            if (oldest !== undefined) seen.delete(oldest);
          }
          setPending(previous => [...previous, notification]);
        }
      )
      .subscribe(status => {
        if (!disposed && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          console.warn("Notification Realtime subscription:", status);
        }
      });

    return () => {
      disposed = true;
      appStateListener.remove();
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!current) return;
    const timeout = setTimeout(() => {
      setPending(previous => previous.filter(item => item.id !== current.id));
    }, current.type === "turn_called" ? 10000 : 6500);
    return () => clearTimeout(timeout);
  }, [current]);

  if (!current) return null;
  const title = titles[current.type ?? ""] ?? "SmartQueue Notification";
  const accent = current.type === "turn_called" ? "#15803D"
    : current.type === "token_skipped" ? "#B91C1C"
    : current.type === "turn_approaching" || current.type === "queue_paused" ? "#B45309"
    : "#2563EB";
  const dismiss = () => setPending(previous => previous.filter(item => item.id !== current.id));

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + 8 }]}>
      <View style={[styles.banner, { borderLeftColor: accent }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${current.message ?? "New queue update."} Open notifications`}
          onPress={() => { dismiss(); router.navigate("/notifications"); }}
          style={styles.content}
        >
          <Ionicons name="notifications-outline" size={24} color={accent} />
          <View style={styles.text} accessibilityLiveRegion="polite">
            <Text style={styles.brand}>SmartQueue</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message} numberOfLines={3}>
              {current.message ?? "You have a new queue update."}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={dismiss} hitSlop={8} style={styles.close}>
          <Ionicons name="close" size={21} color="#64748B" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", left: 12, right: 12, zIndex: 1000, elevation: 16 },
  banner: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: "#FFFFFF",
    borderRadius: 14, borderLeftWidth: 4, padding: 12,
    elevation: 12, shadowColor: "#0F172A", shadowOpacity: 0.18,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  content: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  text: { flex: 1 },
  brand: { color: "#64748B", fontSize: 11, fontWeight: "600", marginBottom: 3 },
  title: { color: "#0F172A", fontSize: 15, fontWeight: "700" },
  message: { color: "#334155", fontSize: 13, marginTop: 3 },
  close: { padding: 6, marginLeft: 4 },
});
