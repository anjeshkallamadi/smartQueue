import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState, useRef } from "react";
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
import NotificationBell from "../components/NotificationBell";

import { checkIsAdmin } from "../services/adminQueueService";

import {
  getAvailableServiceQueues,
  getMyActiveQueues,
  type AvailableServiceQueue,
  type MyActiveQueue,
} from "../services/supabaseQueueService";

export default function Home() {
  const [services, setServices] = useState<AvailableServiceQueue[]>([]);
  const [activeQueues, setActiveQueues] = useState<MyActiveQueue[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeQueueLoading, setActiveQueueLoading] = useState(true);
  const [activeQueueError, setActiveQueueError] = useState<string | null>(
    null
  );
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
    }
  }, []);

  const activeRequest = useRef(0);
  const loadActiveQueues = useCallback(async () => {
    const request = ++activeRequest.current;
    try {
      setActiveQueueError(null);

      const queues = await getMyActiveQueues();
      if (request === activeRequest.current) setActiveQueues(queues);
    } catch (err) {
      if (request !== activeRequest.current) return;
      setActiveQueues([]);
      setActiveQueueError(
        err instanceof Error
          ? err.message
          : "Unable to load your active queues."
      );
    } finally {
      if (request === activeRequest.current) setActiveQueueLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setActiveQueueLoading(true);

      void loadServices();
      void loadActiveQueues();
      return () => { activeRequest.current += 1; };
    }, [loadServices, loadActiveQueues])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setIsAdmin(false);

      checkIsAdmin()
        .then((allowed) => {
          if (active) {
            setIsAdmin(allowed);
          }
        })
        .catch(() => {
          if (active) {
            setIsAdmin(false);
          }
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    setActiveQueueLoading(true);

    try {
      await Promise.all([loadServices(), loadActiveQueues()]);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredServices = services.filter((service) =>
    service.serviceName.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.logoText}>SmartQueue</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <NotificationBell />
          <Pressable
            style={styles.profileButton}
            accessibilityRole="button"
            accessibilityLabel="Open your account"
            onPress={() => router.push("/profile")}
          >
            <Ionicons name="person" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Text style={styles.greeting}>Welcome to SmartQueue 👋</Text>

      <Text style={styles.title}>
        Find a service and skip the waiting line.
      </Text>

      {isAdmin && (
        <Pressable
          style={styles.adminButton}
          accessibilityRole="button"
          accessibilityLabel="Open Admin Dashboard"
          onPress={() => router.push("/admin-dashboard")}
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.adminButtonText}>
            Open Admin Dashboard
          </Text>
        </Pressable>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Search services..."
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        accessibilityLabel="Search available services"
      />

      <Text style={styles.sectionTitle}>My Active Queues</Text>

      {activeQueueLoading ? (
        <View style={{ paddingVertical: 16 }}>
          <ActivityIndicator size="small" />
          <Text
            style={{
              textAlign: "center",
              marginTop: 8,
              color: "#666666",
            }}
          >
            Loading your active queues...
          </Text>
        </View>
      ) : activeQueueError ? (
        <View style={{ paddingVertical: 12 }}>
          <Text style={styles.errorText}>{activeQueueError}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setActiveQueueLoading(true);
              void loadActiveQueues();
            }}
            style={{ paddingVertical: 10 }}
          >
            <Text style={{ color: "#2563EB", fontWeight: "600" }}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : activeQueues.length === 0 ? (
        <ActiveQueueCard
          queue={null}
          loading={false}
          error={null}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {activeQueues.map((queue) => (
            <View key={queue.queueId}>
              <ActiveQueueCard
                queue={queue}
                loading={false}
                error={null}
              />
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Available Services</Text>

      {loading && <ActivityIndicator size="large" />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !error && filteredServices.length === 0 && (
        <Text style={styles.emptyText}>
          {search.trim()
            ? "No services match your search."
            : "No available services found."}
        </Text>
      )}

      {!loading &&
        !error &&
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
