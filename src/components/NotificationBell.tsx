import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getUnreadNotificationCount } from "../services/notificationService";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let loading = false;
      setUnreadCount(null);
      const load = async () => {
        if (loading || !active) return;
        loading = true;
        try {
          const count = await getUnreadNotificationCount();
          if (active) setUnreadCount(count);
        } catch {
          if (active) setUnreadCount(null);
        } finally {
          loading = false;
        }
      };
      void load();
      const interval = setInterval(load, 15000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [])
  );

  return (
    <Pressable
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={unreadCount === null ? "Open notifications" : `Open notifications, ${unreadCount} unread`}
      onPress={() => router.push("/notifications")}
    >
      <Ionicons name="notifications-outline" size={25} color="#2563EB" />
      {unreadCount !== null && unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", position: "relative" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "bold" },
});
