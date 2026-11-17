import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import styles from "../../styles/notificationStyles";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, type AppNotification } from "../services/notificationService";

type IconName = keyof typeof Ionicons.glyphMap;
const notificationTypes: Record<string, { title: string; icon: IconName }> = {
  queue_joined: { title: "Queue Joined Successfully", icon: "ticket-outline" },
  turn_approaching: { title: "Your Turn Is Approaching", icon: "time-outline" },
  turn_called: { title: "It's Your Turn!", icon: "notifications-outline" },
  queue_paused: { title: "Queue Temporarily Paused", icon: "pause-circle-outline" },
  queue_resumed: { title: "Queue Resumed", icon: "play-circle-outline" },
  appointment_completed: { title: "Appointment Completed", icon: "checkmark-circle-outline" },
  token_skipped: { title: "Token Skipped", icon: "alert-circle-outline" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const busy = useRef(false);

  const loadNotifications = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    try {
      const result = await getMyNotifications();
      if (requestId.current === id) setNotifications(result);
    } catch (err) {
      if (requestId.current === id) setError(err instanceof Error ? err.message : "Unable to load notifications.");
    } finally {
      if (requestId.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setNotifications([]);
    void loadNotifications();
    return () => { requestId.current += 1; };
  }, [loadNotifications]));

  const handleRefresh = async () => {
    if (busy.current || refreshing || loading) return;
    setRefreshing(true);
    await loadNotifications();
  };

  const handleRead = async (notification: AppNotification) => {
    if (notification.is_read || busy.current || refreshing || loading) return;
    busy.current = true;
    setUpdating(true);
    try {
      await markNotificationAsRead(notification.id);
      setNotifications(previous => previous.map(item => item.id === notification.id ? { ...item, is_read: true } : item));
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not update notification.");
    } finally {
      busy.current = false;
      setUpdating(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (busy.current || refreshing || loading) return;
    busy.current = true;
    setUpdating(true);
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not mark notifications as read.");
    } finally {
      busy.current = false;
      setUpdating(false);
    }
  };

  const unreadCount = notifications.filter(item => !item.is_read).length;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <Stack.Screen options={{ title: "Notifications" }} />
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {!loading && !error && unreadCount > 0 && (
          <Pressable accessibilityRole="button" disabled={updating || refreshing} onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.subtitle}>{loading || error ? "Your queue updates" : `${unreadCount} unread notifications`}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : error ? (
        <View>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setLoading(true); void loadNotifications(); }}><Text style={styles.retryText}>Try Again</Text></Pressable>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={70} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyMessage}>Your queue updates and appointment alerts will appear here.</Text>
        </View>
      ) : notifications.map(notification => {
        const info = notificationTypes[notification.type ?? ""] ?? { title: "SmartQueue Notification", icon: "notifications-outline" as IconName };
        return (
          <Pressable key={notification.id} accessibilityRole="button" accessibilityLabel={`${info.title}${notification.is_read ? "" : ", unread"}`} disabled={updating || refreshing} style={[styles.card, !notification.is_read && styles.unreadCard]} onPress={() => void handleRead(notification)}>
            <View style={styles.iconContainer}><Ionicons name={info.icon} size={23} color="#2563EB" /></View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{info.title}</Text>
              <Text style={styles.message}>{notification.message ?? "You have a new queue update."}</Text>
              <Text style={styles.time}>{new Date(notification.created_at).toLocaleString()}</Text>
            </View>
            {!notification.is_read && <View style={styles.unreadDot} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
