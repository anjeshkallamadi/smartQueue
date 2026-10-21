import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { supabase } from "../lib/supabase";

export default function AccountSettingsScreen() {
  const [displayName, setDisplayName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadAccount() {
        setLoadingAccount(true);
        setLoadError(null);

        try {
          const { data, error } = await supabase.auth.getUser();

          if (error) throw error;
          if (!data.user) {
            throw new Error("Please log in to manage your account.");
          }

          const user = data.user;
          const metadata = user.user_metadata ?? {};
          const metadataName =
            metadata.full_name ??
            metadata.name ??
            metadata.display_name;
          const fallbackName = user.email
            ? user.email.split("@")[0]
            : "SmartQueue User";

          if (isActive) {
            setDisplayName(
              typeof metadataName === "string" &&
                metadataName.trim().length > 0
                ? metadataName.trim()
                : fallbackName
            );
            setCurrentEmail(user.email ?? "");
            setNewEmail("");
          }
        } catch (error) {
          if (isActive) {
            setLoadError(
              error instanceof Error
                ? error.message
                : "Unable to load your account. Please try again."
            );
          }
        } finally {
          if (isActive) setLoadingAccount(false);
        }
      }

      void loadAccount();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function handleSaveName() {
    const cleanName = displayName.trim();

    if (!cleanName) {
      Alert.alert("Name required", "Please enter a display name.");
      return;
    }

    if (cleanName.length > 60) {
      Alert.alert("Name too long", "Use 60 characters or fewer.");
      return;
    }

    setSavingName(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: cleanName },
      });

      if (error) throw error;

      setDisplayName(cleanName);
      Alert.alert("Profile updated", "Your display name has been saved.");
    } catch (error) {
      Alert.alert(
        "Unable to save name",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangeEmail() {
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!currentEmail) {
      Alert.alert("Email unavailable", "Your current account email could not be found.");
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }

    if (cleanEmail === currentEmail.toLowerCase()) {
      Alert.alert("No change", "Enter an email address different from your current one.");
      return;
    }

    setChangingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: cleanEmail,
      });

      if (error) throw error;

      setNewEmail("");
      Alert.alert(
        "Confirmation required",
        "Supabase has accepted the email change request. Check your inboxes and follow the confirmation instructions. Your account email may not change until verification is complete."
      );
    } catch (error) {
      Alert.alert(
        "Unable to change email",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setChangingEmail(false);
    }
  }

  async function handlePasswordReset() {
    if (!currentEmail) {
      Alert.alert("Email unavailable", "We could not find an email address for this account.");
      return;
    }

    setSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        currentEmail
      );

      if (error) throw error;

      Alert.alert(
        "Reset email sent",
        "Check " +
          currentEmail +
          " for the password-reset link. Open it on a device where SmartQueue is installed and follow the instructions."
      );
    } catch (error) {
      Alert.alert(
        "Unable to send reset email",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Account Settings</Text>
            <Text style={styles.subtitle}>
              Manage your profile and sign-in details.
            </Text>
          </View>
        </View>

        {loadingAccount ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.helpText}>Loading account details...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.sectionHeading}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>A</Text>
                </View>
                <View style={styles.sectionHeadingCopy}>
                  <Text style={styles.sectionTitle}>Display name</Text>
                  <Text style={styles.helpText}>
                    This name is saved to your SmartQueue profile.
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={60}
                editable={!savingName}
                accessibilityLabel="Display name"
                returnKeyType="done"
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  savingName && styles.buttonDisabled,
                ]}
                disabled={savingName}
                onPress={() => void handleSaveName()}
                accessibilityRole="button"
              >
                {savingName ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save name</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeading}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>@</Text>
                </View>
                <View style={styles.sectionHeadingCopy}>
                  <Text style={styles.sectionTitle}>Email address</Text>
                  <Text style={styles.helpText}>
                    Your current sign-in email.
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>Current email</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>
                  {currentEmail || "No email available"}
                </Text>
              </View>

              <Text style={styles.label}>New email address</Text>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="name@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!changingEmail}
                accessibilityLabel="New email address"
                returnKeyType="done"
              />

              <Text style={styles.note}>
                Supabase may require email confirmation before the new address becomes active.
              </Text>

              <Pressable
                style={[
                  styles.primaryButton,
                  changingEmail && styles.buttonDisabled,
                ]}
                disabled={changingEmail}
                onPress={() => void handleChangeEmail()}
                accessibilityRole="button"
              >
                {changingEmail ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Request email change
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeading}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>*</Text>
                </View>
                <View style={styles.sectionHeadingCopy}>
                  <Text style={styles.sectionTitle}>Password reset</Text>
                  <Text style={styles.helpText}>
                    We will send a secure reset link to your current email.
                  </Text>
                </View>
              </View>

              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>
                  {currentEmail || "No email available"}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.secondaryButton,
                  sendingReset && styles.buttonDisabled,
                ]}
                disabled={sendingReset}
                onPress={() => void handlePasswordReset()}
                accessibilityRole="button"
              >
                {sendingReset ? (
                  <ActivityIndicator color="#2563EB" />
                ) : (
                  <Text style={styles.secondaryButtonText}>
                    Send password-reset email
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        <Text style={styles.footer}>
          Email confirmation and password-reset links depend on your Supabase Auth email and redirect settings.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  content: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
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
  headerCopy: {
    flex: 1,
  },
  title: {
    color: "#111827",
    fontSize: 23,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    color: "#2563EB",
    fontSize: 17,
    fontWeight: "700",
  },
  sectionHeadingCopy: {
    flex: 1,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  helpText: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  label: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    color: "#111827",
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  readOnlyText: {
    color: "#4B5563",
    fontSize: 14,
  },
  note: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  primaryButton: {
    minHeight: 46,
    backgroundColor: "#2563EB",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 46,
    backgroundColor: "#EFF6FF",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  secondaryButtonText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },
});
