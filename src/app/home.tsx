import { useEffect, useState } from "react";
import { Text, View, Pressable, Alert } from "react-native";
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
import styles from "../../styles/loginStyles";

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

        // Load queue for normal users
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
      <View style={styles.container}>
        <Text style={styles.title}>
          Admin Dashboard
        </Text>

        <Text style={styles.subtitle}>
          Welcome, {profile.name}
        </Text>

        <Text>
          Role: {profile.role}
        </Text>

        <Text
          style={{
            fontSize: 20,
            marginVertical: 20,
          }}
        >
          OPD Registration
        </Text>

        <Pressable
          style={styles.button}
          onPress={handleCallNext}
        >
          <Text style={styles.buttonText}>
            Call Next Token
          </Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={handleSkipToken}
        >
          <Text style={styles.buttonText}>
            Skip Current Token
          </Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={handlePauseQueue}
        >
          <Text style={styles.buttonText}>
            Pause Queue
          </Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={handleResumeQueue}
        >
          <Text style={styles.buttonText}>
            Resume Queue
          </Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>
            Logout
          </Text>
        </Pressable>
      </View>
    );
  }

  // =========================
  // NORMAL USER SCREEN
  // =========================

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        SmartQueue
      </Text>

      <Text style={styles.subtitle}>
        Welcome, {profile.name} 👋
      </Text>

      <Text>
        Email: {profile.email}
      </Text>

      <Text>
        Role: {profile.role}
      </Text>

      <Text
        style={{
          fontSize: 20,
          marginTop: 25,
        }}
      >
        Available Queue
      </Text>

      {queue ? (
        <View style={{ marginTop: 15 }}>
          <Text style={{ fontSize: 18 }}>
            {queue.services[0]?.name ?? "Unknown Service"}
          </Text>

          <Text>
            Location:{" "}
            {queue.services[0]?.location ?? "Unknown"}
          </Text>

          <Text>
            Current Token: {queue.current_token}
          </Text>

          <Text>
            Status: {queue.status}
          </Text>

          <Pressable
            style={styles.button}
            onPress={handleJoinQueue}
          >
            <Text style={styles.buttonText}>
              Join Queue
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={{ marginTop: 15 }}>
          No queues available
        </Text>
      )}

      <Pressable
        style={styles.button}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>
          Logout
        </Text>
      </Pressable>
    </View>
  );
}