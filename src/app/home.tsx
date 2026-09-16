import { useEffect, useState } from "react";
import { Text, View, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import styles from "../../styles/loginStyles";

type UserProfile = {
  name: string;
  email: string;
  role: string;
};

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("name, email, role")
        .eq("id", user.id)
        .single();

      if (error) {
        Alert.alert("Error", "Could not load your profile");
        return;
      }

      setProfile(data);
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Logout failed", error.message);
      return;
    }

    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartQueue</Text>

      {profile && (
        <>
          <Text style={styles.subtitle}>
            Welcome, {profile.name} 👋
          </Text>

          <Text>
            Email: {profile.email}
          </Text>

          <Text>
            Role: {profile.role}
          </Text>
        </>
      )}

      <Pressable
        style={styles.button}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}