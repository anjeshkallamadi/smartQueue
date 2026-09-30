import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";

import {
  callNextToken,
  skipToken,
  pauseQueue,
  resumeQueue,
  getQueues,
  joinQueue,
} from "../lib/queueService";

import { supabase } from "../lib/supabase";
import styles from "../../styles/homeStyles";

const QUEUE_ID = "f24ea8de-5f1f-474e-b094-b1116e8351fb";

type Profile = {
  name: string;
  email: string;
  role: string;
};

type Queue = {
  id: string;
  date: string;
  status: string;
  current_token: number;
  average_service_time: number;
  services: {
    name: string;
    description: string;
    category: string;
    location: string;
  }[];
};

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profileData, error: profileError } =
          await supabase
            .from("users")
            .select("name, email, role")
            .eq("id", user.id)
            .single();

        if (profileError) {
          throw profileError;
        }

        setProfile(profileData);

        if (profileData.role === "user") {
          const queues = await getQueues();

          if (queues.length > 0) {
            setQueue(queues[0] as Queue);
          }
        }
      } catch (error) {
        console.log(error);
        Alert.alert("Error", "Could not load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCallNext = async () => {
    try {
      const updatedQueue = await callNextToken(QUEUE_ID);

      setQueue((prev) =>
        prev
          ? {
              ...prev,
              current_token: updatedQueue.current_token,
            }
          : prev
      );

      Alert.alert(
        "Success",
        `Current token is now ${updatedQueue.current_token}`
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not call next token");
    }
  };

  const handleSkipToken = async () => {
    try {
      const updatedQueue = await skipToken(QUEUE_ID);

      setQueue((prev) =>
        prev
          ? {
              ...prev,
              current_token: updatedQueue.current_token,
            }
          : prev
      );

      Alert.alert(
        "Token Skipped",
        `Current token is now ${updatedQueue.current_token}`
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not skip token");
    }
  };

  const handlePauseQueue = async () => {
    try {
      const updatedQueue = await pauseQueue(QUEUE_ID);

      setQueue((prev) =>
        prev
          ? {
              ...prev,
              status: updatedQueue.status,
            }
          : prev
      );

      Alert.alert("Queue Paused", "The queue has been paused.");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not pause queue");
    }
  };

  const handleResumeQueue = async () => {
    try {
      const updatedQueue = await resumeQueue(QUEUE_ID);

      setQueue((prev) =>
        prev
          ? {
              ...prev,
              status: updatedQueue.status,
            }
          : prev
      );

      Alert.alert("Queue Resumed", "The queue is active again.");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not resume queue");
    }
  };

  const handleJoinQueue = async () => {
    if (!queue) return;

    try {
      const entry = await joinQueue(queue.id);

      Alert.alert(
        "Queue Joined!",
        `Your token number is ${entry.token_number}`
      );
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Cannot Join Queue",
        error instanceof Error
          ? error.message
          : "Could not join queue"
      );
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Logout failed", error.message);
      return;
    }

    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  // =========================
  // ADMIN SCREEN
  // =========================

  if (profile.role === "admin") {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          Admin Dashboard
        </Text>

        <Text style={styles.title}>
          Welcome, {profile.name}
        </Text>

        <Text>
          Role: {profile.role}
        </Text>

        <Text style={styles.sectionTitle}>
          Queue Management
        </Text>

        <View style={styles.queueCard}>
          <Text style={styles.serviceName}>
            OPD Registration
          </Text>

          <Text style={styles.serviceDescription}>
            Manage the current registration queue.
          </Text>

          <Pressable
            style={styles.joinButton}
            onPress={handleCallNext}
          >
            <Text style={styles.joinButtonText}>
              Call Next Token
            </Text>
          </Pressable>

          <Pressable
            style={styles.joinButton}
            onPress={handleSkipToken}
          >
            <Text style={styles.joinButtonText}>
              Skip Current Token
            </Text>
          </Pressable>

          <Pressable
            style={styles.joinButton}
            onPress={handlePauseQueue}
          >
            <Text style={styles.joinButtonText}>
              Pause Queue
            </Text>
          </Pressable>

          <Pressable
            style={styles.joinButton}
            onPress={handleResumeQueue}
          >
            <Text style={styles.joinButtonText}>
              Resume Queue
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.joinButton}
          onPress={handleLogout}
        >
          <Text style={styles.joinButtonText}>
            Logout
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // =========================
  // NORMAL USER SCREEN
  // =========================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.greeting}>
        Welcome, {profile.name} 👋
      </Text>

      <Text style={styles.title}>
        Find a service and skip the waiting line.
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search services..."
      />

      <Text style={styles.sectionTitle}>
        My Active Queue
      </Text>

      {queue ? (
        <View style={styles.activeQueueCard}>
          <Text style={styles.activeQueueTitle}>
            {queue.services[0]?.name ?? "Unknown Service"}
          </Text>

          <Text style={styles.emptyText}>
            Location:{" "}
            {queue.services[0]?.location ?? "Unknown"}
          </Text>

          <Text style={styles.emptyText}>
            Current Token: {queue.current_token}
          </Text>

          <Text style={styles.emptyText}>
            Status: {queue.status}
          </Text>

          <Pressable
            style={styles.joinButton}
            onPress={handleJoinQueue}
          >
            <Text style={styles.joinButtonText}>
              Join Queue
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.activeQueueCard}>
          <Text style={styles.activeQueueTitle}>
            No active queue
          </Text>

          <Text style={styles.emptyText}>
            No queues are currently available.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Available Services
      </Text>

      {queue ? (
        <View style={styles.queueCard}>
          <Text style={styles.serviceName}>
            {queue.services[0]?.name ?? "Service"}
          </Text>

          <Text style={styles.serviceDescription}>
            {queue.services[0]?.description ??
              "Join this service queue remotely."}
          </Text>

          <Text style={styles.serviceDescription}>
            Location:{" "}
            {queue.services[0]?.location ?? "Unknown"}
          </Text>

          <Pressable
            style={styles.joinButton}
            onPress={handleJoinQueue}
          >
            <Text style={styles.joinButtonText}>
              Join Queue
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.emptyText}>
          No services available.
        </Text>
      )}

      <Pressable
        style={styles.joinButton}
        onPress={handleLogout}
      >
        <Text style={styles.joinButtonText}>
          Logout
        </Text>
      </Pressable>
    </ScrollView>
  );
}