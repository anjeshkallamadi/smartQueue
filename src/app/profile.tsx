import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { supabase } from "../lib/supabase";
import {
  formatQueueToken,
  getMyActiveQueues,
  type MyActiveQueue,
} from "../services/supabaseQueueService";
import styles from "../../styles/profileStyles";



export default function Profile() {
  const [displayName, setDisplayName] = useState("SmartQueue User");
  const [email, setEmail] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [activeQueues, setActiveQueues] = useState<MyActiveQueue[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadAccount() {
        setLoadingProfile(true);
        setQueueError(null);

        try {
          const { data, error } = await supabase.auth.getUser();

          if (error) {
            throw error;
          }

          if (!isActive) return;

          const user = data.user;

          if (!user) {
            setDisplayName("SmartQueue User");
            setEmail("");
            setActiveQueues([]);
            return;
          }

          const metadata = user.user_metadata ?? {};
          const metadataName: unknown =
            metadata.full_name ??
            metadata.name ??
            metadata.display_name;

          const userEmail = user.email ?? "";
          const fallbackName = userEmail
            ? userEmail.split("@")[0]
            : "SmartQueue User";

          setDisplayName(
            typeof metadataName === "string" &&
              metadataName.trim().length > 0
              ? metadataName.trim()
              : fallbackName
          );
          setEmail(userEmail);

          const userQueues = await getMyActiveQueues();

          if (isActive) {
            setActiveQueues(userQueues);
          }
        } catch {
          if (isActive) {
            setQueueError(
              "Unable to load your account or queue information. Please try again."
            );
            setActiveQueues([]);
          }
        } finally {
          if (isActive) {
            setLoadingProfile(false);
          }
        }
      }

      void loadAccount();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "SQ";

  async function handleLogout() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // _layout.tsx observes the auth change and redirects to Login.
    } catch (error) {
      setSigningOut(false);

      Alert.alert(
        "Logout failed",
        error instanceof Error
          ? error.message
          : "Please try again."
      );
    }
  }

  function confirmLogout() {
    Alert.alert(
      "Log out?",
      "You will need to sign in again to use SmartQueue.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => void handleLogout(),
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {loadingProfile ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        <Text style={styles.name}>
          {loadingProfile ? "Loading account..." : displayName}
        </Text>

        <Text style={styles.email}>
          {loadingProfile ? " " : email || "No email available"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Active Queue</Text>

        {loadingProfile ? (
          <ActivityIndicator />
        ) : queueError ? (
          <Text style={styles.cardText}>{queueError}</Text>
        ) : activeQueues.length === 0 ? (
          <Text style={styles.cardText}>
            You are not currently waiting in any queue.
            Join a service to see your queue information here.
          </Text>
        ) : (
          activeQueues.map((queue) => (
            <View
              key={queue.queueId}
              style={styles.activeQueueItem}
            >
              <Text style={styles.queueServiceName}>
                {queue.serviceName}
              </Text>

              <View style={styles.queueInfoRow}>
                <Text style={styles.queueInfoLabel}>Your token</Text>
                <Text style={styles.queueInfoValue}>
                  {queue.tokenNumber === null
                    ? "Pending verification"
                    : formatQueueToken(queue.tokenNumber)}
                </Text>
              </View>

              <View style={styles.queueInfoRow}>
                <Text style={styles.queueInfoLabel}>
                  People ahead
                </Text>
                <Text style={styles.queueInfoValue}>
                  {queue.peopleAhead === null
                    ? "Not verified"
                    : queue.peopleAhead}
                </Text>
              </View>

              <View style={styles.queueInfoRow}>
                <Text style={styles.queueInfoLabel}>
                  Estimated wait
                </Text>
                <Text style={styles.queueInfoValue}>
                  {queue.estimatedWaitMinutes === null
                    ? "Not available"
                    : queue.estimatedWaitMinutes + " min"}
                </Text>
              </View>

              <View style={styles.queueInfoRow}>
                <Text style={styles.queueInfoLabel}>Status</Text>
                <Text style={styles.queueInfoValue}>
                  {queue.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Pressable
        style={styles.option}
        accessibilityRole="button"
        accessibilityLabel="View queue history"
        onPress={() => router.push("/queue-history" as any)}
      >
        <Text style={styles.optionText}>Queue History</Text>
        <Text style={styles.optionArrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.option}
        accessibilityRole="button"
        accessibilityLabel="Open account settings"
        onPress={() => router.push("/account-settings" as any)}
      >
        <Text style={styles.optionText}>Account Settings</Text>
        <Text style={styles.optionArrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.logoutButton}
        accessibilityRole="button"
        disabled={signingOut}
        onPress={confirmLogout}
      >
        <Text style={styles.logoutText}>
          {signingOut ? "Logging out..." : "Log Out"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
