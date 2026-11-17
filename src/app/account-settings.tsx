import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack, router, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import styles from "../../styles/accountSettingsStyles";

const AVATAR_BUCKET = "avatars";

export default function AccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useFocusEffect(useCallback(() => {
    let active = true;
    async function loadSettings() {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        setLoading(false);
        Alert.alert("Unable to load account", error?.message ?? "Please sign in again.");
        return;
      }
      const user = data.user;
      const metadata = user.user_metadata ?? {};
      const savedName = metadata.full_name ?? metadata.name ?? metadata.display_name;
      setName(typeof savedName === "string" ? savedName : (user.email?.split("@")[0] ?? ""));
      setEmail(user.email ?? "");
      setAvatarUrl(typeof metadata.avatar_url === "string" ? metadata.avatar_url : null);
      setLoading(false);
    }
    void loadSettings();
    return () => { active = false; };
  }, []));

  const saveName = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: cleanName, name: cleanName, display_name: cleanName },
      });
      if (error) throw error;
      setName(cleanName);
      Alert.alert("Profile updated", "Your name has been saved.");
    } catch (error) {
      Alert.alert("Could not update name", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 8) {
      Alert.alert("Password too short", "Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Enter the same password in both fields.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your new password has been saved.");
    } catch (error) {
      Alert.alert("Could not update password", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow SmartQueue to access your photos to choose a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const file = await response.blob();
      const extension = (asset.fileName?.split(".").pop() || asset.mimeType?.split("/")[1] || "jpg").toLowerCase();
      const safeExtension = /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
      const path = `${(await supabase.auth.getUser()).data.user?.id}/profile-${Date.now()}.${safeExtension}`;
      const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        contentType: asset.mimeType ?? "image/jpeg",
        upsert: true,
        cacheControl: "3600",
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
      Alert.alert("Photo updated", "Your profile photo has been saved.");
    } catch (error) {
      Alert.alert("Could not update photo", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: "Account Settings" }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.backButton} accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Account Settings</Text>
            <Text style={styles.subtitle}>Keep your SmartQueue profile up to date</Text>
          </View>
        </View>

        {loading ? <ActivityIndicator size="large" color="#3986D7" /> : (
          <>
            <View style={styles.photoCard}>
              <View style={styles.avatar}>
                {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarInitial}>{name.trim().charAt(0).toUpperCase() || "S"}</Text>}
              </View>
              <View style={styles.photoCopy}>
                <Text style={styles.sectionTitle}>Profile photo</Text>
                <Text style={styles.helper}>Choose a square photo that represents you.</Text>
                <Pressable style={styles.secondaryButton} disabled={uploadingPhoto} onPress={() => void choosePhoto()}>
                  {uploadingPhoto ? <ActivityIndicator color="#286DB7" /> : <Text style={styles.secondaryButtonText}>Change photo</Text>}
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Personal information</Text>
              <Text style={styles.label}>Full name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Enter your name" placeholderTextColor="#91A0B2" autoCapitalize="words" style={styles.input} editable={!savingName} />
              <Text style={styles.label}>Email address</Text>
              <TextInput value={email} editable={false} style={[styles.input, styles.readOnlyInput]} />
              <Text style={styles.helper}>Email changes are not available here.</Text>
              <Pressable style={styles.primaryButton} disabled={savingName} onPress={() => void saveName()}>
                {savingName ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Save name</Text>}
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Change password</Text>
              <Text style={styles.label}>New password</Text>
              <TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor="#91A0B2" secureTextEntry autoCapitalize="none" style={styles.input} />
              <Text style={styles.label}>Confirm new password</Text>
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter the password again" placeholderTextColor="#91A0B2" secureTextEntry autoCapitalize="none" style={styles.input} />
              <Text style={styles.helper}>Use at least 8 characters and keep your password private.</Text>
              <Pressable style={styles.primaryButton} disabled={savingPassword} onPress={() => void savePassword()}>
                {savingPassword ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Update password</Text>}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
