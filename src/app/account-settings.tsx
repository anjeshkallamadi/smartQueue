import { useCallback, useState, useRef } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack, router, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAccountSettingsStyles } from "../../styles/accountSettingsStyles";
import { useAppTheme } from "../context/ThemeContext";
import { getAvatarUrl, uploadAvatar, errorMessage } from "../services/avatarService";



export default function AccountSettings() {
  const styles = useAccountSettingsStyles();
  const { dark, colors, setDark } = useAppTheme();
  const photoBusy = useRef(false);
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
      try { const url = await getAvatarUrl(user); if (active) setAvatarUrl(url); } catch { if (active) setAvatarUrl(null); }
      if (active) setLoading(false);
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
    if (photoBusy.current) return;
    photoBusy.current = true;
    setUploadingPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const url = await uploadAvatar(result.assets[0]);
      setAvatarUrl(url);
      Alert.alert("Photo updated", "Your profile photo has been saved.");
    } catch (error) {
      Alert.alert("Could not update photo", errorMessage(error));
    } finally {
      photoBusy.current = false;
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

        {loading ? <ActivityIndicator size="large" color={colors.primary} /> : (
          <>
            <View style={styles.photoCard}>
              <View style={styles.avatar}>
                {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarInitial}>{name.trim().charAt(0).toUpperCase() || "S"}</Text>}
              </View>
              <View style={styles.photoCopy}>
                <Text style={styles.sectionTitle}>Profile photo</Text>
                <Text style={styles.helper}>Choose a square photo that represents you.</Text>
                <Pressable style={styles.secondaryButton} disabled={uploadingPhoto || savingName || savingPassword} onPress={() => void choosePhoto()}>
                  {uploadingPhoto ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={styles.secondaryButtonText}>Change photo</Text>}
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <View style={{flex:1}}><Text style={styles.sectionTitle}>Dark mode</Text><Text style={styles.helper}>Saved on this device</Text></View>
                <Switch accessibilityLabel="Dark mode" value={dark} onValueChange={setDark} trackColor={{false:colors.border,true:colors.teal}} />
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Personal information</Text>
              <Text style={styles.label}>Full name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Enter your name" placeholderTextColor={colors.secondaryText} autoCapitalize="words" style={styles.input} editable={!savingName} />
              <Text style={styles.label}>Email address</Text>
              <TextInput value={email} editable={false} style={[styles.input, styles.readOnlyInput]} />
              <Text style={styles.helper}>Email changes are not available here.</Text>
              <Pressable style={styles.primaryButton} disabled={savingName || uploadingPhoto || savingPassword} onPress={() => void saveName()}>
                {savingName ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Save name</Text>}
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Change password</Text>
              <Text style={styles.label}>New password</Text>
              <TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.secondaryText} secureTextEntry autoCapitalize="none" style={styles.input} />
              <Text style={styles.label}>Confirm new password</Text>
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter the password again" placeholderTextColor={colors.secondaryText} secureTextEntry autoCapitalize="none" style={styles.input} />
              <Text style={styles.helper}>Use at least 8 characters and keep your password private.</Text>
              <Pressable style={styles.primaryButton} disabled={savingPassword || uploadingPhoto || savingName} onPress={() => void savePassword()}>
                {savingPassword ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Update password</Text>}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
