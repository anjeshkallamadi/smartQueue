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

type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  status: string;
};

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("name, email, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        Alert.alert("Error", "Could not load your profile");
        return;
      }

      setProfile(profileData);

      // Get active services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, description, category, location, status")
        .eq("status", "active");

      if (servicesError) {
        Alert.alert("Error", "Could not load services");
        return;
      }

      setServices(servicesData);
    };

    loadData();
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

          <Text>Email: {profile.email}</Text>
          <Text>Role: {profile.role}</Text>
        </>
      )}

      <Text style={{ marginTop: 20, fontSize: 20 }}>
        Available Services
      </Text>

      {services.map((service) => (
        <View key={service.id} style={{ marginTop: 15 }}>
          <Text>{service.name}</Text>
          <Text>{service.description}</Text>
          <Text>{service.category}</Text>
          <Text>{service.location}</Text>
        </View>
      ))}

      <Pressable
        style={styles.button}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}