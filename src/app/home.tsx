import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import styles from "../../styles/homeStyles";
import ActiveQueueCard from "../components/ActiveQueueCard";
import ServiceCard from "../components/ServiceCard";
import SmartQueueLogo from "../components/SmartQueueLogo";

import { checkIsAdmin } from "../services/adminQueueService";

import {
  getAvailableServiceQueues,
  type AvailableServiceQueue,
} from "../services/supabaseQueueService";

export default function Home() {
  const [services, setServices] = useState<AvailableServiceQueue[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      setError(null);
      const result = await getAvailableServiceQueues();
      setServices(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load services."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadServices();
    }, [loadServices])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsAdmin(false);

      checkIsAdmin()
        .then((allowed) => {
          if (active) setIsAdmin(allowed);
        })
        .catch(() => {
          if (active) setIsAdmin(false);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadServices();
  };

  const filteredServices = services.filter((service) =>
    service.serviceName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <SmartQueueLogo size={42} />
          <Text style={styles.logoText}>
            Smart<Text style={{ color: "#2FA99D" }}>Queue</Text>
          </Text>
        </View>
        <Pressable
          style={styles.profileButton}
          accessibilityRole="button"
          accessibilityLabel="Open your account"
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person" size={21} color="#3986D7" />
        </Pressable>
      </View>

      <Text style={styles.greeting}>Welcome to SmartQueue 👋</Text>
      <Text style={styles.title}>
        Find a service and skip the waiting line.
      </Text>

      {isAdmin && (
        <Pressable
          style={styles.adminButton}
          accessibilityRole="button"
          onPress={() => router.push("/admin-dashboard")}
        >
          <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          <Text style={styles.adminButtonText}>Open Admin Dashboard</Text>
        </Pressable>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Search services..."
        placeholderTextColor="#91A1B4"
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.sectionTitle}>My Active Queue</Text>
      <ActiveQueueCard />
      <Text style={styles.sectionTitle}>Available Services</Text>

      {loading && <ActivityIndicator size="large" color="#3986D7" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && !error && filteredServices.length === 0 && (
        <Text style={styles.emptyText}>No available services found.</Text>
      )}

      {!loading &&
        filteredServices.map((service) => (
          <ServiceCard
            key={service.queueId}
            name={service.serviceName}
            description={service.description}
            onPress={() =>
              router.push({
                pathname: "/queue-details",
                params: {
                  queueId: service.queueId,
                  serviceName: service.serviceName,
                  description: service.description,
                },
              })
            }
          />
        ))}
    </ScrollView>
  );
}
