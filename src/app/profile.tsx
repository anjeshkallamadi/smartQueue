import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import styles from "../../styles/profileStyles";

export default function Profile() {
  const [displayName, setDisplayName] = useState("SmartQueue User");
  const [email, setEmail] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(useCallback(() => {
    let isActive = true;
    async function loadAccount() {
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!isActive) return;
        const user = data.user;
        if (!user) {
          setDisplayName("SmartQueue User");
          setEmail("");
          return;
        }
        const metadata = user.user_metadata ?? {};
        const metadataName: unknown = metadata.full_name ?? metadata.name ?? metadata.display_name;
        const userEmail = user.email ?? "";
        const fallbackName = userEmail ? userEmail.split("@")[0] : "SmartQueue User";
        setDisplayName(typeof metadataName === "string" && metadataName.trim().length > 0 ? metadataName.trim() : fallbackName);
        setEmail(userEmail);
      } catch {
        if (isActive) Alert.alert("Unable to load account", "Please try again.");
      } finally {
        if (isActive) setLoadingProfile(false);
      }
    }
    void loadAccount();
    return () => { isActive = false; };
  }, []));

  const initials = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part.charAt(0).toUpperCase()).join("") || "SQ";

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setSigningOut(false);
      Alert.alert("Logout failed", error instanceof Error ? error.message : "Please try again.");
    }
  }

  function confirmLogout() {
    Alert.alert("Log out?", "You will need to sign in again to use SmartQueue.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => void handleLogout() },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
      </View>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {loadingProfile ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.avatarText}>{initials}</Text>}
        </View>
        <Text style={styles.name}>{loadingProfile ? "Loading account..." : displayName}</Text>
        <Text style={styles.email}>{loadingProfile ? " " : email || "No email available"}</Text>
      </View>
      <Pressable style={styles.option} accessibilityRole="button" onPress={() => router.push("/queue-history")}>
        <Text style={styles.optionText}>Queue History</Text><Text style={styles.optionArrow}>›</Text>
      </Pressable>
      <Pressable style={styles.option} accessibilityRole="button" onPress={() => Alert.alert("Account Settings", "Account settings will be available in a future update.")}>
        <Text style={styles.optionText}>Account Settings</Text><Text style={styles.optionArrow}>›</Text>
      </Pressable>
      <Pressable style={styles.logoutButton} accessibilityRole="button" disabled={signingOut} onPress={confirmLogout}>
        <Text style={styles.logoutText}>{signingOut ? "Logging out..." : "Log Out"}</Text>
      </Pressable>
    </ScrollView>
  );
}
